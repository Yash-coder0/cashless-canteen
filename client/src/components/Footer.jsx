import { Instagram, Linkedin, ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-6 px-6 mt-auto">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
        
        {/* Brand */}
        <div className="text-center md:text-left">
          <h2 className="font-display font-700 text-xl text-white mb-2 flex items-center justify-center md:justify-start gap-2">
            <img src="/rit-logo.png" alt="RIT" className="w-6 h-6 rounded" onError={(e) => { e.target.style.display='none' }} />
            RIT Canteen
          </h2>
          <p className="text-xs text-gray-400 max-w-xs mx-auto md:mx-0">
            Official cashless canteen portal for Rajarambapu Institute of Technology, Rajaramnagar.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-12 text-center md:text-left">
          <div className="flex flex-col gap-2">
            <h3 className="text-white font-semibold text-[11px] tracking-wider uppercase mb-1">Connect</h3>
            <a href="https://ritindia.edu" target="_blank" rel="noreferrer" className="text-xs hover:text-white transition-colors flex items-center justify-center md:justify-start gap-1.5">
              <ExternalLink size={12} /> Official Website
            </a>
            <a href="http://172.22.4.115/ritcms/Default.aspx" target="_blank" rel="noreferrer" className="text-xs hover:text-white transition-colors flex items-center justify-center md:justify-start gap-1.5">
              <ExternalLink size={12} /> RITAGE (In-campus)
            </a>
            <a href="http://210.212.171.172/ritcms/" target="_blank" rel="noreferrer" className="text-xs hover:text-white transition-colors flex items-center justify-center md:justify-start gap-1.5">
              <ExternalLink size={12} /> RITAGE (Off-campus)
            </a>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-white font-semibold text-[11px] tracking-wider uppercase mb-1">Socials</h3>
            <a href="https://www.instagram.com/ritindiaedu/" target="_blank" rel="noreferrer" className="text-xs hover:text-white transition-colors flex items-center justify-center md:justify-start gap-1.5">
              <Instagram size={12} /> Instagram
            </a>
            <a href="https://www.linkedin.com/school/rajarambapu-institute-of-technology-rajaramnagar-sakharale/posts/?feedView=all" target="_blank" rel="noreferrer" className="text-xs hover:text-white transition-colors flex items-center justify-center md:justify-start gap-1.5">
              <Linkedin size={12} /> LinkedIn
            </a>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto mt-6 pt-4 border-t border-gray-800 text-center text-[10px] text-gray-500">
        © {new Date().getFullYear()} Rajarambapu Institute of Technology. All rights reserved.
      </div>
    </footer>
  )
}
