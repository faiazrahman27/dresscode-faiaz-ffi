import { Link } from 'react-router-dom'

const platformLinks = [
  { to: '/how-it-works', label: 'How it Works' },
  { to: '/use-cases', label: 'Use Cases' },
  { to: '/solutions', label: 'Solutions' },
  { to: '/journal', label: 'Journal' },
]

const companyLinks = [
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/portal', label: 'Portal' },
]

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-orb footer-orb-1" />
      <div className="footer-orb footer-orb-2" />

      <div className="container py-14">
        <div className="footer-panel">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div>
              <Link to="/" className="footer-brand">
                <div className="footer-brand-mark">
                  <span className="display footer-brand-letter">D</span>
                </div>

                <div>
                  <div className="display mb-1 text-2xl font-bold">Dresscode</div>
                  <div className="footer-brand-subtitle">wearable media infrastructure</div>
                </div>
              </Link>

              <p className="footer-copy mt-5 max-w-md text-sm leading-7 text-white/62">
                A wearable media infrastructure platform where every garment, object,
                or collectible can unlock a dynamic digital experience.
              </p>

              <div className="footer-chip-row mt-6">
                <span className="footer-chip">Profiles</span>
                <span className="footer-chip">Activation</span>
                <span className="footer-chip">Live Content</span>
              </div>
            </div>

            <div>
              <div className="footer-heading">
                Platform
              </div>

              <div className="footer-links">
                {platformLinks.map((item) => (
                  <Link key={item.to} to={item.to} className="footer-link">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="footer-heading">
                Company
              </div>

              <div className="footer-links">
                {companyLinks.map((item) => (
                  <Link key={item.to} to={item.to} className="footer-link">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="divider my-10" />

          <div className="footer-bottom">
            <span>© Dresscode 2026. All rights reserved.</span>
            <span>Wearable media · profiles · activation · live content</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
