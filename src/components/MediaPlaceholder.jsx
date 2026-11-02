import React from 'react'
import homeShowcase from '../assets/showcase/Konn3ct meeting screen showcase.png'
import governmentShowcase from '../assets/showcase/Konn3ct shared presentation interface.png'
import associationsShowcase from '../assets/showcase/Konn3ct meeting interface with clean captions.png'
import educationShowcase from '../assets/showcase/Connected learning in action.png'
import faithShowcase from '../assets/showcase/Virtual fellowship meeting with shared teaching.png'
import businessShowcase from '../assets/showcase/Team meeting feature showcase.png'
import eventsShowcase from '../assets/showcase/Konn3ct community event session.png'

const SHOWCASE_BY_VARIANT = {
  home: {
    src: homeShowcase,
    alt: 'Konn3ct meeting screen showcase',
  },
  government: {
    src: governmentShowcase,
    alt: 'Konn3ct shared presentation interface for government coordination briefing',
  },
  associations: {
    src: associationsShowcase,
    alt: 'Konn3ct meeting interface with clean captions for member learning sessions',
  },
  education: {
    src: educationShowcase,
    alt: 'Connected learning in action on Konn3ct',
  },
  faith: {
    src: faithShowcase,
    alt: 'Virtual fellowship meeting with shared teaching on Konn3ct',
  },
  business: {
    src: businessShowcase,
    alt: 'Team meeting feature showcase on Konn3ct',
  },
  corporates: {
    src: businessShowcase,
    alt: 'Team meeting feature showcase on Konn3ct',
  },
  events: {
    src: eventsShowcase,
    alt: 'Konn3ct community event session',
  },
  'events-community': {
    src: eventsShowcase,
    alt: 'Konn3ct community event session',
  },
}

export default function MediaPlaceholder({ variant = 'home', type, label }) {
  const rawType = type || variant || 'home'
  const showcase = SHOWCASE_BY_VARIANT[rawType] || SHOWCASE_BY_VARIANT.home

  return (
    <div className="hero-visual hero-visual-image">
      <img
        src={showcase.src}
        alt={label || showcase.alt}
        className="hero-showcase-img"
      />
    </div>
  )
}
