import { ConsoleSection } from './components/ConsoleSection';
import { LiveTelemetry } from './components/LiveTelemetry/LiveTelemetry';
import { SystemLog } from './components/SystemLog/SystemLog';
import { DatabaseActions } from './components/DatabaseActions/DatabaseActions';
import { redirect } from 'next/navigation';
import { UserRegistry } from './components/UserRegistry/UserRegistry';

export default async function DevToolsPage() {
    if (process.env.NODE_ENV === 'production') redirect('/');

    return (
        <div className="text-gunmetal selection:bg-gunmetal selection:text-yellow min-h-screen bg-[#f1f5f9]">
            <main className="mx-auto max-w-375 space-y-12 p-6 md:p-12">
                <header className="border-gunmetal border-b-4 pb-10">
                    <div className="flex items-center gap-3 italic">
                        <div className="bg-yellow h-6 w-2" />
                        <h1 className="text-6xl font-black tracking-tighter uppercase">
                            System Console
                        </h1>
                    </div>
                    <p className="mt-4 font-mono text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">
                        Orchestrator // Local Development Environment
                    </p>
                </header>

                <ConsoleSection title="Live Console">
                    <SystemLog />
                </ConsoleSection>

                <ConsoleSection
                    title="Live Telemetry"
                    subtitle="DB Sync"
                >
                    <LiveTelemetry />
                </ConsoleSection>

                <DatabaseActions />

                <ConsoleSection title="Access Registry">
                    <UserRegistry />
                </ConsoleSection>

                <footer className="pt-8 text-center font-mono text-[10px] font-black tracking-[0.5em] text-slate-400 uppercase">
                    Supabase Admin Engine // Status: Active
                </footer>
            </main>
        </div>
    );
}
