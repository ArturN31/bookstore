export default function ReturnPolicy() {
    return (
        <div className="mx-auto grid max-w-4xl gap-4 p-6 text-slate-800">
            <h1
                className="text-3xl font-bold tracking-tight"
                data-testid="return-policy-header"
            >
                Return Policy & Simulated Refund Disclaimer
            </h1>

            <p className="text-sm text-slate-500">
                <span className="font-semibold">Effective Date:</span> 02/10/2026
            </p>

            <div className="my-2 rounded-r border-l-4 border-amber-500 bg-amber-50 p-4 shadow-sm">
                <h2 className="mb-1 text-lg font-bold text-amber-900">
                    IMPORTANT NOTICE: NON-COMMERCIAL DEMONSTRATION SITE
                </h2>
                <p className="text-sm text-amber-800">
                    Welcome to Books 4 You, a hands-on personal project built to explore and master
                    modern web development from the ground up. This platform serves as a living
                    sandbox for experimenting with full-stack architecture, intuitive UI/UX design,
                    LLM integration, automated testing, and modern developer workflows. Because this
                    project is strictly an educational endeavor, it is not intended for commercial
                    or production use—all catalog items, transactions, and account details exist
                    solely to test features and refine software engineering techniques.
                </p>
            </div>

            <h2 className="mt-4 text-xl font-bold">1. Non-Commercial Policy Scope</h2>
            <p>
                Books 4 You is an educational software application designed to model modern
                e-commerce user workflows. No physical products are stocked, sold, or shipped by
                this website, and no real monetary transactions are processed. Consequently, no
                actual physical returns, exchanges, or monetary refunds are offered or executed.
            </p>

            <h2 className="mt-4 text-xl font-bold">2. Absolute Limitation of Liability</h2>
            <p className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
                PLEASE READ THIS SECTION CAREFULLY.
            </p>
            <p>
                THE RETURN AND REFUND MECHANISMS PRESENTED ON THIS SITE ARE ENTIRELY SIMULATED FOR
                FUNCTIONALITY DEMONSTRATION AND TESTING PURPOSES ONLY. UNDER NO CIRCUMSTANCES SHALL
                THE DEVELOPER(S), SITE OWNER(S), OR CONTRIBUTORS BE LIABLE FOR ANY CLAIMS, LOSSES,
                DEMANDS, OR DAMAGES ARISING FROM MISUNDERSTANDINGS REGARDING SIMULATED ORDERS,
                PURCHASES, RETURNS, OR FINANCIAL REFUNDS.
            </p>

            <h2 className="mt-4 text-xl font-bold">
                3. Simulated Order & Refund Lifecycle Workflow
            </h2>
            <p>
                In order to test full-stack e-commerce state management, transactional API
                endpoints, database updates, and UI flows, the application simulates the following
                return workflow:
            </p>
            <ul className="list-disc space-y-1 pl-6">
                <li>
                    <span className="font-semibold">Simulated Eligibility:</span> Test orders placed
                    on the platform may be marked for simulated return within a demo window (e.g.,
                    30 days of simulated purchase) solely to test order status transitions in the
                    user interface.
                </li>
                <li>
                    <span className="font-semibold">
                        Simulated Order Cancellation & Status Updates:
                    </span>{' '}
                    Initiating a return or cancellation request in the demo interface updates mock
                    database records and triggers automated UI state changes for testing purposes.
                </li>
                <li>
                    <span className="font-semibold">Simulated Credits:</span> Any ledger or account
                    updates reflecting &quot;refunded amounts&quot; or &quot;store credits&quot; are
                    purely virtual mock values without monetary value or legal enforceability.
                </li>
            </ul>

            <h2 className="mt-4 text-xl font-bold">4. Shipping & Handling Disclaimer</h2>
            <p>
                Since no physical items are stocked or dispatched, users should never send physical
                mail or packages to any addresses listed on or associated with this demonstration
                site. The developer assumes no responsibility or liability for physical items sent
                in error.
            </p>

            <h2 className="mt-4 text-xl font-bold">5. Contact Information</h2>
            <p>
                As this application is a personal educational project, no customer support service
                or direct contact details are available.
            </p>
        </div>
    );
}
