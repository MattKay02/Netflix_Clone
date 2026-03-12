/*
  WHY THIS FILE EXISTS:
  A static footer that replicates Netflix's footer layout — contact line,
  four columns of links, a service-code button, and a copyright notice.
  All link buttons are intentionally non-functional placeholders; they will
  be wired up if the corresponding features are built.
*/

const FOOTER_LINKS = [
  ['FAQ',               'Help Centre',      'Account',          'Media Centre'],
  ['Investor Relations','Jobs',             'Ways to Watch',    'Terms of Use'],
  ['Privacy',           'Cookie Preferences','Corporate Info',  'Contact Us'],
  ['Speed Test',        'Legal Notices',    'Only on Netflix',  'Ad Choices'],
] as const

export function Footer() {
  return (
    <footer className="bg-netflix-dark border-t border-white/10 px-4 sm:px-12 xl:px-16 pt-10 pb-8 text-white/50">

      {/* Phone line */}
      <p className="text-sm mb-6">
        Questions? Call{' '}
        <span className="hover:underline cursor-default">1-844-505-2993</span>
      </p>

      {/* 4-column link grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4 mb-8">
        {FOOTER_LINKS.flat().map((label) => (
          <button
            key={label}
            type="button"
            disabled
            className="text-left text-xs text-white/50 hover:underline
                       cursor-default disabled:cursor-default py-0.5"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Service code */}
      <button
        type="button"
        disabled
        className="text-xs border border-white/30 text-white/50 px-3 py-1.5 mb-5
                   cursor-default disabled:cursor-default"
      >
        Service Code
      </button>

      {/* Copyright */}
      <p className="text-xs text-white/30">
        © {new Date().getFullYear()} Netflix Clone. Built for learning purposes only.
        Not affiliated with Netflix, Inc.
      </p>
    </footer>
  )
}
