import { useConsent } from '@/providers/ConsentProvider';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Switch,
} from '@mui/material';
import { useState } from 'react';

export const ConsentDialog = () => {
    const { closeSettings, saveCustomConsent, isSettingsOpen } = useConsent();

    const [analyticsState, setAnalyticsState] = useState<boolean>(true);

    return (
        <Dialog
            open={isSettingsOpen}
            onClose={closeSettings}
            maxWidth="sm"
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    backgroundColor: '#111827',
                    color: '#ffffff',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                },
            }}
        >
            <DialogTitle className="bg-gunmetal border-gunmetal border-b font-bold text-white">
                Cookie Preferences
            </DialogTitle>
            <DialogContent className="bg-gunmetal pt-6">
                <div className="flex flex-col gap-6 pt-2">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-white">Strictly Necessary Cookies</h3>
                            <p className="mt-1 text-xs text-slate-400">
                                Required for core functionality, account authentication, security,
                                and cart session management. These cannot be disabled.
                            </p>
                        </div>
                        <Switch
                            checked
                            disabled
                        />
                    </div>
                    <div className="border-gunmetal flex items-center justify-between gap-4 border-t pt-6">
                        <div>
                            <h3 className="font-semibold text-white">Analytics Cookies</h3>
                            <p className="mt-1 text-xs text-slate-400">
                                Allows us to collect completely anonymous performance metrics via
                                Vercel Analytics to continuously refine our online library.
                            </p>
                        </div>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={analyticsState}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                        setAnalyticsState(event.target.checked)
                                    }
                                />
                            }
                            label=""
                        />
                    </div>
                </div>
            </DialogContent>
            <DialogActions className="bg-gunmetal border-gunmetal border-t p-4">
                <button
                    type="button"
                    onClick={closeSettings}
                    className="cursor-pointer rounded border-none bg-transparent px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={() => saveCustomConsent(analyticsState)}
                    className="bg-yellow cursor-pointer rounded border border-black px-5 py-2 text-sm font-bold text-black transition-colors hover:bg-sky-500"
                >
                    Save Preferences
                </button>
            </DialogActions>
        </Dialog>
    );
};
