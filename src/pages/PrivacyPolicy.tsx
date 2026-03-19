import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: March 2026 &nbsp;|&nbsp; Street Surfers / South Side Shuttles
        </p>

        <div className="space-y-8 text-sm text-foreground leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-base font-semibold mb-3">1. Who We Are (Responsible Party)</h2>
            <p>
              Street Surfers, trading as South Side Shuttles ("we", "us", or "our"), operates a
              technology-assisted transport service for passengers, scholars, and corporate clients in
              South Africa. We are the responsible party as defined in the Protection of Personal
              Information Act 4 of 2013 (POPIA) in respect of the personal information you share with
              us through this application.
            </p>
            <p className="mt-3">
              You may contact us at:{' '}
              <a href="mailto:privacy@streetsurfers.co.za" className="text-accent underline underline-offset-2">
                privacy@streetsurfers.co.za
              </a>
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-base font-semibold mb-3">2. What Personal Information We Collect</h2>
            <p className="mb-2">We collect only the information necessary to provide our transport service:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Account information:</strong> Full name, email address, phone number, password (hashed — never stored in plain text)</li>
              <li><strong>Location data:</strong> Home address (including GPS coordinates), work or school address</li>
              <li><strong>Passenger type and schedule:</strong> Whether you are staff or a scholar, shift type, and daily transport schedule</li>
              <li><strong>Scholar information (if applicable):</strong> Grade / year, guardian name, guardian phone number, guardian email, school attended</li>
              <li><strong>Driver information (for drivers only):</strong> South African ID number, date of birth, gender, licence code and expiry, PDP number and expiry, coverage areas, availability, consent declarations, vehicle details and document photographs</li>
              <li><strong>Usage data:</strong> Trip history, real-time GPS position during active trips (drivers only)</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-base font-semibold mb-3">3. Why We Collect This Information</h2>
            <p className="mb-2">We process your personal information for the following purposes:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Planning and dispatching transport routes to your home and work/school</li>
              <li>Matching you with an assigned driver for your scheduled trips</li>
              <li>Enabling real-time tracking of your assigned vehicle during active trips</li>
              <li>Providing emergency and safety features (SOS, incident logging)</li>
              <li>Communicating trip updates, schedule changes, and service notifications</li>
              <li>Verifying driver qualifications and suitability for the role</li>
              <li>Meeting our legal and regulatory obligations</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-base font-semibold mb-3">4. Legal Basis for Processing</h2>
            <p>
              We process your personal information on the basis of your informed consent, which you
              provide when you create an account. You also acknowledge that processing is necessary
              to perform the transport service you have requested from us. Where required by law (e.g.
              driver background checks), we process information to comply with a legal obligation.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-base font-semibold mb-3">5. How We Store and Protect Your Information</h2>
            <p>
              Your information is stored on Supabase infrastructure, which uses industry-standard
              encryption at rest and in transit (TLS 1.2+). Access to your data is controlled by
              row-level security policies — each user can only access their own records. Driver
              documents are stored in restricted private storage buckets and are not publicly
              accessible.
            </p>
            <p className="mt-3">
              We retain your personal information for as long as your account is active. Driver GPS
              location history is automatically deleted after 90 days. If you request deletion of
              your account, we will remove your personal information within 30 days, subject to any
              legal retention obligations.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-base font-semibold mb-3">6. Who We Share Your Information With</h2>
            <p className="mb-2">We do not sell your personal information. We may share it with:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Your assigned driver</strong> — name and pick-up address only, for the purpose of completing your trip</li>
              <li><strong>Your employer or school</strong> — only where they are the contracting party who arranged your transport</li>
              <li><strong>Our dispatch staff</strong> — for operational planning and support</li>
              <li><strong>Service providers</strong> — such as our database provider (Supabase), who are bound by data processing agreements</li>
              <li><strong>Law enforcement</strong> — only where required by a valid legal order or in a genuine safety emergency</li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-base font-semibold mb-3">7. Your Rights Under POPIA</h2>
            <p className="mb-2">As a data subject under POPIA, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Access</strong> the personal information we hold about you</li>
              <li><strong>Correct</strong> inaccurate or incomplete personal information</li>
              <li><strong>Delete</strong> your personal information (where no legal obligation requires us to retain it)</li>
              <li><strong>Object</strong> to the processing of your personal information</li>
              <li><strong>Withdraw consent</strong> at any time (withdrawal will not affect lawfulness of prior processing)</li>
              <li><strong>Lodge a complaint</strong> with the Information Regulator of South Africa</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:privacy@streetsurfers.co.za" className="text-accent underline underline-offset-2">
                privacy@streetsurfers.co.za
              </a>.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-base font-semibold mb-3">8. Information Regulator of South Africa</h2>
            <p>
              If you believe we have violated your rights under POPIA, you may lodge a complaint with
              the Information Regulator:
            </p>
            <div className="mt-3 p-4 rounded-xl bg-secondary border border-border space-y-1">
              <p className="font-medium">Information Regulator (South Africa)</p>
              <p>JD House, 27 Stiemens Street, Braamfontein, Johannesburg, 2001</p>
              <p>
                Email:{' '}
                <a href="mailto:inforeg@justice.gov.za" className="text-accent underline underline-offset-2">
                  inforeg@justice.gov.za
                </a>
              </p>
              <p>
                Website:{' '}
                <span className="text-accent">www.inforegulator.org.za</span>
              </p>
            </div>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-base font-semibold mb-3">9. Cookies and Tracking</h2>
            <p>
              This application does not use advertising cookies or third-party tracking. We use
              session tokens stored in browser local storage solely to keep you logged in between
              visits.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-base font-semibold mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we
              will notify you via the app. Continued use of the service after notification constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <div className="pt-4 border-t border-border text-muted-foreground text-xs">
            <p>Street Surfers / South Side Shuttles &mdash; Protecting your personal information under POPIA Act 4 of 2013.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
