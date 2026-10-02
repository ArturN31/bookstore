export default function PrivacyPolicy() {
    return (
        <div className="mx-auto grid max-w-4xl gap-4 p-6 text-slate-800">
            <h1
                className="text-3xl font-bold tracking-tight"
                data-testid="privacy-policy-header"
            >
                Privacy Policy & Educational Project Disclaimer
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

            <h2 className="mt-4 text-xl font-bold">
                1. General Educational Disclaimer & Assumption of Risk
            </h2>
            <p>
                By accessing or using Books 4 You, you acknowledge and agree that this website is
                provided exclusively for demonstration, experimental, and educational purposes. Any
                information, data, or content submitted to or processed by this application is done
                entirely at your own risk.
            </p>

            <h2 className="mt-4 text-xl font-bold">
                2. Absolute Limitation of Liability & &quot;AS IS&quot; Provision
            </h2>
            <p className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
                PLEASE READ THIS SECTION CAREFULLY.
            </p>
            <p>
                THIS APPLICATION AND ALL ITS CONTENT, FEATURES, AND FUNCTIONALITIES ARE PROVIDED ON
                AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY
                KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, DATA ACCURACY,
                OR SECURITY.
            </p>
            <p>
                TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE DEVELOPER(S), OWNER(S), AND
                CONTRIBUTORS OF THIS PROJECT SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS,
                DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
            </p>
            <ul className="list-disc space-y-1 pl-6">
                <li>YOUR ACCESS TO OR USE OF (OR INABILITY TO ACCESS OR USE) THE APPLICATION;</li>
                <li>
                    ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SERVERS, DATA, OR PERSONAL INFORMATION
                    STORED THEREIN;
                </li>
                <li>
                    ANY BUGS, VIRUSES, TROJAN HORSES, OR SECURITY VULNERABILITIES THAT MAY BE
                    TRANSMITTED TO OR THROUGH THE SERVICE;
                </li>
                <li>
                    ANY DATA LOSS, ACCIDENTAL DISCLOSURE, APPLICATION DOWNTIME, OR SYSTEM FAILURE.
                </li>
            </ul>

            <h2 className="mt-4 text-xl font-bold">3. Prohibition of Real or Sensitive Data</h2>
            <p>
                Users are strictly prohibited from entering confidential, sensitive, real financial,
                or highly confidential personal information into this application (such as real
                passwords used elsewhere, government identification, credit card details, or health
                information). The developer is not responsible or liable for any security breaches,
                data leaks, or unauthorized third-party access involving sensitive information
                provided by users.
            </p>

            <h2 className="mt-4 text-xl font-bold">4. Information We Collect</h2>
            <h3 className="mt-2 text-lg font-semibold">Information You Provide:</h3>
            <ul className="list-disc space-y-1 pl-6">
                <li>
                    <span className="font-semibold">Account & Profile Information:</span> Usernames,
                    mock email addresses, or test contact details provided upon account creation.
                </li>
                <li>
                    <span className="font-semibold">Simulated Order & Interaction Data:</span> Mock
                    purchase history, saved preferences, cart items, and test feedback or reviews
                    submitted during interaction with the platform.
                </li>
            </ul>

            <h3 className="mt-2 text-lg font-semibold">Information Automatically Collected:</h3>
            <ul className="list-disc space-y-1 pl-6">
                <li>
                    <span className="font-semibold">Log Data & Analytics:</span> IP addresses,
                    browser types, operating systems, referring URLs, access times, and diagnostic
                    telemetry collected for debugging, monitoring, and educational evaluation.
                </li>
                <li>
                    <span className="font-semibold">Cookies & Local Storage:</span> Session cookies,
                    web storage, and similar web technologies used to maintain user authentication
                    states, preferences, and functionality across page views.
                </li>
            </ul>

            <h2 className="mt-4 text-xl font-bold">5. Use of Information</h2>
            <p>Collected information is utilized strictly to:</p>
            <ul className="list-disc space-y-1 pl-6">
                <li>
                    Demonstrate, test, and improve application functionality and user experience.
                </li>
                <li>
                    Simulate core e-commerce workflows (such as cart processing and account
                    management).
                </li>
                <li>
                    Evaluate server performance, debugging logs, and AI/LLM integration behaviors.
                </li>
                <li>
                    Maintain system security and prevent unauthorized exploitation of demo features.
                </li>
            </ul>

            <h2 className="mt-4 text-xl font-bold">6. Third-Party Services & LLM Integrations</h2>
            <p>
                This application may integrate with third-party service providers (such as cloud
                hosting infrastructure, authentication providers, and Large Language Model / AI
                APIs). Data submitted through interactive AI features or standard inputs may be
                transmitted to these third parties for processing solely as required to deliver site
                features. We accept no liability for third-party privacy policies or data processing
                standards.
            </p>

            <h2 className="mt-4 text-xl font-bold">7. Data Retention & Account Resets</h2>
            <p>
                Because this site operates as a testing platform, application data, databases, and
                user accounts may be modified, wiped, or reset at any time without prior notice or
                backup guarantees.
            </p>

            <h2 className="mt-4 text-xl font-bold">8. Children&apos;s Privacy</h2>
            <p>
                This application is not intended for or directed toward children under the age of
                13. We do not knowingly collect personal information from children under 13 years of
                age.
            </p>

            <h2 className="mt-4 text-xl font-bold">9. Modifications to This Policy</h2>
            <p>
                The developer reserves the right to update or modify this Privacy Policy and
                Liability Disclaimer at any time without prior notice. Continued use of the
                application after changes are posted constitutes acceptance of the modified terms.
            </p>

            <h2 className="mt-4 text-xl font-bold">10. Contact Information</h2>
            <p>
                As this application is a personal educational demonstration project, no dedicated
                email support, customer service desk, or direct contact methods are provided.
            </p>
        </div>
    );
}
