import React from 'react'
import konn3ctLogo from '../assets/konn3ct-logo.png'

export default function Brand({ inverse = false, compact = false }) {
  return (
    <div className="flex items-center" aria-label="Konn3ct">
      <img
        src={konn3ctLogo}
        alt="Konn3ct"
        className={`w-auto object-contain ${compact ? 'h-8' : 'h-10 md:h-11'} ${inverse ? 'brightness-0 invert' : ''}`}
      />
    </div>
  )
}



// import React from 'react'

// export default function Brand({ inverse = false, compact = false }) {
//   return (
//     <div className="flex items-center gap-2.5" aria-label="Konn3ct">
//       <div className="relative h-9 w-11 shrink-0" aria-hidden="true">
//         <span className={`absolute left-0 top-1/2 h-4 w-8 -translate-y-1/2 rotate-[-10deg] rounded-full border-[3px] ${inverse ? 'border-white' : 'border-brand-blue'}`} />
//         <span className={`absolute right-0 top-1/2 h-4 w-8 -translate-y-1/2 rotate-[10deg] rounded-full border-[3px] ${inverse ? 'border-white' : 'border-brand-green'}`} />
//       </div>
//       <span className={`font-display font-extrabold tracking-[-0.05em] ${compact ? 'text-xl' : 'text-2xl'} ${inverse ? 'text-white' : 'text-brand-navy'}`}>
//         Konn<span className={inverse ? 'text-[#9ED27A]' : 'text-brand-green'}>3</span>ct
//       </span>
//     </div>
//   )
// }
