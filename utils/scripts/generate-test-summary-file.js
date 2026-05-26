const fs = require('fs');
const path = require('path');

try {
    const summaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const rootDir = process.cwd();

    const r = {
        total: {
            statements: summary.total.statements.pct,
            branches: summary.total.branches.pct,
            functions: summary.total.functions.pct,
            lines: summary.total.lines.pct,
            average: parseFloat(((summary.total.statements.pct + summary.total.branches.pct + summary.total.functions.pct + summary.total.lines.pct) / 4).toFixed(2))
        },
        paths: {}
    };

    Object.entries(summary).forEach(([p, d]) => {
        if (p === 'total') return;

        const relativePath = path.relative(rootDir, p);
        const normalized = relativePath.replace(/\\/g, '/');
        const segments = normalized.split('/');

        if (segments.length < 2) return;

        const groupName = segments.slice(0, 2).join('/');

        if (!r.paths[groupName]) r.paths[groupName] = {
            statementsSum: 0,
            branchesSum: 0,
            functionsSum: 0,
            linesSum: 0,
            count: 0
        };

        r.paths[groupName].statementsSum += d.statements.pct;
        r.paths[groupName].branchesSum += d.branches.pct;
        r.paths[groupName].functionsSum += d.functions.pct;
        r.paths[groupName].linesSum += d.lines.pct;
        r.paths[groupName].count++;
    });

    // Calculate averages for each group path
    Object.keys(r.paths).forEach(k => {
        const group = r.paths[k];

        const statementsAvg = group.statementsSum / group.count;
        const branchesAvg = group.branchesSum / group.count;
        const functionsAvg = group.functionsSum / group.count;
        const linesAvg = group.linesSum / group.count;
        const combinedAvg = (statementsAvg + branchesAvg + functionsAvg + linesAvg) / 4;

        r.paths[k] = {
            statements: statementsAvg.toFixed(2) + '%',
            branches: branchesAvg.toFixed(2) + '%',
            functions: functionsAvg.toFixed(2) + '%',
            lines: linesAvg.toFixed(2) + '%',
            average: combinedAvg.toFixed(2) + '%'
        };
    });

    fs.writeFileSync('test-summary.json', JSON.stringify(r, null, 2));
    console.log('Accurate coverage summary generated: test-summary.json');
} catch (err) {
    console.error('Error generating summary:', err.message);
    process.exit(1);
}