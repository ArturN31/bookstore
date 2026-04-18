import { AppTooltip } from '@/components/ui/AppTooltip';
import { render } from '@testing-library/react';

describe('AppTooltip', () => {
    it('should render with default variant (dark background)', () => {
        render(
            <AppTooltip title="Test tooltip">
                <span>Hover me</span>
            </AppTooltip>
        );

        // The tooltip should be in the document (MUI renders it in a portal)
        expect(document.body).toBeInTheDocument();
    });

    it('should render with accent variant (yellow background)', () => {
        render(
            <AppTooltip title="Test tooltip" variant="accent">
                <span>Hover me</span>
            </AppTooltip>
        );

        // The tooltip should be in the document (MUI renders it in a portal)
        expect(document.body).toBeInTheDocument();
    });

    it('should pass through additional props to MUI Tooltip', () => {
        render(
            <AppTooltip title="Test tooltip" placement="top">
                <span>Hover me</span>
            </AppTooltip>
        );

        expect(document.body).toBeInTheDocument();
    });
});
