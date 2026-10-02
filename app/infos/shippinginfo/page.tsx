export default function ShippingInformation() {
    return (
        <div className="mx-auto grid max-w-4xl gap-4 p-6 text-slate-800">
            <h1
                className="text-3xl font-bold tracking-tight"
                data-testid="shipping-info-header"
            >
                Shipping Information & Simulated Delivery Disclaimer
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

            <h2 className="mt-4 text-xl font-bold">1. Non-Commercial Shipping Scope</h2>
            <p>
                Books 4 You is a web application created exclusively for software development and
                UI/UX testing. No physical items, books, or merchandise are stocked, packaged,
                dispatched, or delivered by this project. All shipping calculations, carrier
                options, delivery time estimates, and fulfillment statuses are entirely simulated.
            </p>

            <h2 className="mt-4 text-xl font-bold">2. Absolute Limitation of Liability</h2>
            <p className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
                PLEASE READ THIS SECTION CAREFULLY.
            </p>
            <p>
                UNDER NO CIRCUMSTANCES SHALL THE DEVELOPER(S), SITE OWNER(S), OR CONTRIBUTORS BE
                HELD RESPONSIBLE OR LIABLE FOR ANY EXPECTATIONS, LOSSES, CLAIMS, OR DAMAGES ARISING
                FROM MISUNDERSTANDINGS REGARDING PHYSICAL ITEM DELIVERY. NO PHYSICAL MAIL SHOULD
                EVER BE SENT TO OR EXPECTED FROM THIS PLATFORM.
            </p>

            <h2 className="mt-4 text-xl font-bold">3. Simulated Shipping Methods</h2>
            <p>
                For the purpose of testing user interface checkout calculations, database logic, and
                delivery state changes, the application models the following sample parameters:
            </p>
            <ul className="list-disc space-y-2 pl-6">
                <li>
                    <span className="font-semibold">Standard Shipping (Simulated):</span>
                    <ul className="list-circle mt-1 space-y-1 pl-6">
                        <li>Estimated simulated delivery window: 2–5 business days.</li>
                        <li>
                            Simulated calculations: Variable mock rate algorithms based on item
                            weight within the United Kingdom.
                        </li>
                    </ul>
                </li>
            </ul>

            <h2 className="mt-4 text-xl font-bold">4. Simulated Order Processing & Tracking</h2>
            <p>
                Order status changes (such as &quot;Processing&quot;, &quot;Dispatched&quot;, or
                &quot;Delivered&quot;) and mock tracking reference numbers exist strictly as virtual
                state values within the application. They are generated to test real-time state
                management, UI notification components, and automated testing suites.
            </p>

            <h2 className="mt-4 text-xl font-bold">5. Contact Information</h2>
            <p>
                As this application is a personal educational demonstration project, no direct
                contact channels, support email addresses, or phone numbers are maintained.
            </p>
        </div>
    );
}
