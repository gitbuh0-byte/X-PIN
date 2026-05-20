import React from 'react';

const TermsOfUse: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-black text-white p-4 sm:p-6 pb-24">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h1 className="text-3xl sm:text-4xl font-arcade font-black text-neon-cyan mb-2">TERMS OF USE</h1>
          <p className="text-neon-gold">Last updated: December 2024</p>
        </div>

        {/* Content */}
        <div className="space-y-8 bg-slate-900/40 border border-neon-cyan/20 rounded-lg p-6 sm:p-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">1. Agreement to Terms</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              By accessing and using X-SPIN ("the Platform"), you agree to be bound by these Terms of Use. If you disagree with any part of these terms, you may not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">2. User Eligibility</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              You must be at least 18 years old and legally permitted to engage in gaming activities in your jurisdiction. You represent and warrant that all information provided during registration is true and accurate.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">3. Account Responsibility</h2>
            <div className="text-slate-300 text-sm leading-relaxed space-y-3">
              <p>You are responsible for:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Maintaining the confidentiality of your login credentials</li>
                <li>All activity conducted under your account</li>
                <li>Notifying us immediately of unauthorized access</li>
                <li>Complying with all applicable laws and regulations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">4. Responsible Gaming</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              We promote responsible gaming. If you experience gambling addiction or need support, please contact the National Problem Gambling Helpline or seek professional help. You can set limits on your account anytime.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">5. Prohibited Conduct</h2>
            <div className="text-slate-300 text-sm leading-relaxed space-y-3">
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Create multiple accounts to gain unfair advantage</li>
                <li>Use automated tools or bots to play games</li>
                <li>Engage in collusion or fraud</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Harass or abuse other players or staff</li>
                <li>Attempt to manipulate game outcomes</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">6. Deposits & Withdrawals</h2>
            <div className="text-slate-300 text-sm leading-relaxed space-y-3">
              <p>
                <strong className="text-neon-gold">Deposits:</strong> Funds are credited instantly to your account. You are responsible for ensuring you have sufficient funds before placing bets.
              </p>
              <p>
                <strong className="text-neon-gold">Withdrawals:</strong> Requests are processed within 2-5 business days. Minimum withdrawal is KSh 10. All funds must be verified before withdrawal.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">7. Game Rules & Payouts</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              All game outcomes are determined by the spin wheel algorithm. Winnings are credited instantly to your account. X-SPIN reserves the right to suspend accounts involved in fraud or unfair play.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">8. Limitation of Liability</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              X-SPIN is provided "as-is" without warranties. We are not liable for indirect, incidental, or consequential damages. Your liability is limited to the amount of funds in your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">9. Modifications</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              We reserve the right to modify these terms at any time. Continued use of the Platform constitutes acceptance of modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">10. Contact</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              For questions about these Terms, please contact: <br/>
              <strong className="text-neon-gold">Email:</strong> legal@x-spin.com <br/>
              <strong className="text-neon-gold">Phone:</strong> +1 (800) SPIN-HLP
            </p>
          </section>
        </div>

        {/* Accept Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.history.back()}
            className="px-8 py-3 bg-neon-cyan text-black font-arcade font-bold rounded hover:bg-white transition-colors active:scale-95"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
