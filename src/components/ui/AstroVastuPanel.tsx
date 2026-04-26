'use client'
import React, { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { RASHI_NAMES, GRAHA_NAMES } from '@/types/astrology'

const ChakraSelector = dynamic(
  () => import('@/components/chakra/ChakraSelector').then(m => m.ChakraSelector),
  { ssr: false }
)

interface AstroVastuPanelProps { chart: ChartOutput }

/* ══════════════════════════════════════════════════════════════════
   VEDIC VASTU DATA — Sources: Manasara, Mayamata, Brihat Samhita,
   Vishwakarma Prakash, Samarangana Sutradhara, Vastu Vidya,
   Mahavastu by Khushdeep Bansal, Vastu Shastra by Dr. Prasanna
   ══════════════════════════════════════════════════════════════════ */

/* 16-Kona (Mahavastu) zone mapping ─────────────────────────────── */
const ZONES_16 = [
  { id: 'N',   name: 'North',            ruling: 'Me', element: 'Jal',    prana: 'Udana',  quality: 'Opportunities, Career, New Beginnings',   angle: 0 },
  { id: 'NNE', name: 'North-North-East', ruling: 'Ju', element: 'Jal',    prana: 'Prana',  quality: 'Health, Immunity, Divine Blessings',      angle: 22.5 },
  { id: 'NE',  name: 'North-East',       ruling: 'Ju', element: 'Jal',    prana: 'Prana',  quality: 'Wisdom, Clarity, Spiritual Growth',        angle: 45 },
  { id: 'ENE', name: 'East-North-East',  ruling: 'Su', element: 'Vayu',   prana: 'Vyana',  quality: 'Refreshment, Joy, Social Energy',          angle: 67.5 },
  { id: 'E',   name: 'East',             ruling: 'Su', element: 'Vayu',   prana: 'Vyana',  quality: 'Social Connectivity, Visibility, Growth',  angle: 90 },
  { id: 'ESE', name: 'East-South-East',  ruling: 'Ve', element: 'Vayu',   prana: 'Apana',  quality: 'Churning, Anxiety, Transformation',        angle: 112.5 },
  { id: 'SE',  name: 'South-East',       ruling: 'Ve', element: 'Agni',   prana: 'Apana',  quality: 'Cash Flow, Confidence, Fire Energy',       angle: 135 },
  { id: 'SSE', name: 'South-South-East', ruling: 'Ma', element: 'Agni',   prana: 'Apana',  quality: 'Strength, Confidence, Assertion',          angle: 157.5 },
  { id: 'S',   name: 'South',            ruling: 'Ma', element: 'Agni',   prana: 'Samana', quality: 'Relaxation, Fame, Social Recognition',     angle: 180 },
  { id: 'SSW', name: 'South-South-West', ruling: 'Ra', element: 'Prithvi',prana: 'Samana', quality: 'Expenditure, Disposal, Letting Go',        angle: 202.5 },
  { id: 'SW',  name: 'South-West',       ruling: 'Ra', element: 'Prithvi',prana: 'Samana', quality: 'Skills, Relationships, Stability',         angle: 225 },
  { id: 'WSW', name: 'West-South-West',  ruling: 'Sa', element: 'Prithvi',prana: 'Apana',  quality: 'Education, Savings, Discipline',           angle: 247.5 },
  { id: 'W',   name: 'West',             ruling: 'Sa', element: 'Akasha', prana: 'Vyana',  quality: 'Gains, Profits, Results of Effort',        angle: 270 },
  { id: 'WNW', name: 'West-North-West',  ruling: 'Mo', element: 'Akasha', prana: 'Udana',  quality: 'Depression, Detox, Purification',          angle: 292.5 },
  { id: 'NW',  name: 'North-West',       ruling: 'Mo', element: 'Vayu',   prana: 'Udana',  quality: 'Support, Banking, Helpful People',         angle: 315 },
  { id: 'NNW', name: 'North-North-West', ruling: 'Me', element: 'Vayu',   prana: 'Prana',  quality: 'Attraction, Sensuality, Charisma',         angle: 337.5 },
]

const ZONES_8 = [
  { id: 'N',  name: 'North',      ruling: 'Me', element: 'Jal',    prana: 'Udana',  quality: 'Opportunities, Career',    angle: 0 },
  { id: 'NE', name: 'North-East', ruling: 'Ju', element: 'Jal',    prana: 'Prana',  quality: 'Wisdom, Spiritual Growth', angle: 45 },
  { id: 'E',  name: 'East',       ruling: 'Su', element: 'Vayu',   prana: 'Vyana',  quality: 'Social Connectivity',      angle: 90 },
  { id: 'SE', name: 'South-East', ruling: 'Ve', element: 'Agni',   prana: 'Apana',  quality: 'Cash Flow, Confidence',    angle: 135 },
  { id: 'S',  name: 'South',      ruling: 'Ma', element: 'Agni',   prana: 'Samana', quality: 'Relaxation, Fame',         angle: 180 },
  { id: 'SW', name: 'South-West', ruling: 'Ra', element: 'Prithvi',prana: 'Samana', quality: 'Skills, Relationships',    angle: 225 },
  { id: 'W',  name: 'West',       ruling: 'Sa', element: 'Akasha', prana: 'Vyana',  quality: 'Gains, Profits',           angle: 270 },
  { id: 'NW', name: 'North-West', ruling: 'Mo', element: 'Vayu',   prana: 'Udana',  quality: 'Support, Banking',         angle: 315 },
]

/* 45-Deity Vastu Purusha Mandala (Ekashitipada) ─────────────────── */
const DEITY_MAP = [
  { id: 'shikhi',        name: 'Shikhi',        x: 8, y: 0, w: 1, h: 1, ang: [33.75,45],    wall: 'N', dwaraQ: 'average' },
  { id: 'parjanya',      name: 'Parjanya',       x: 7, y: 0, w: 1, h: 1, ang: [45,56.25],   wall: 'N', dwaraQ: 'good' },
  { id: 'jayant',        name: 'Jayant',         x: 6, y: 0, w: 1, h: 1, ang: [56.25,67.5], wall: 'N', dwaraQ: 'best' },
  { id: 'indra',         name: 'Indra',          x: 5, y: 0, w: 1, h: 1, ang: [67.5,78.75], wall: 'N', dwaraQ: 'best' },
  { id: 'surya',         name: 'Surya',          x: 4, y: 0, w: 1, h: 1, ang: [78.75,90],   wall: 'N', dwaraQ: 'good' },
  { id: 'satya',         name: 'Satya',          x: 3, y: 0, w: 1, h: 1, ang: [90,101.25],  wall: 'N', dwaraQ: 'average' },
  { id: 'bhrisha',       name: 'Bhrisha',        x: 2, y: 0, w: 1, h: 1, ang: [101.25,112.5],wall:'N', dwaraQ: 'average' },
  { id: 'antariksh',     name: 'Antariksh',      x: 1, y: 0, w: 1, h: 1, ang: [112.5,123.75],wall:'N', dwaraQ: 'good' },
  { id: 'agni',          name: 'Agni',           x: 8, y: 1, w: 1, h: 1, ang: [123.75,135],  wall: 'E', dwaraQ: 'average' },
  { id: 'pusha',         name: 'Pusha',          x: 8, y: 2, w: 1, h: 1, ang: [135,146.25],  wall: 'E', dwaraQ: 'good' },
  { id: 'vitatha',       name: 'Vitatha',        x: 8, y: 3, w: 1, h: 1, ang: [146.25,157.5],wall: 'E', dwaraQ: 'average' },
  { id: 'grihakshat',    name: 'Grihakshat',     x: 8, y: 4, w: 1, h: 1, ang: [157.5,168.75],wall: 'E', dwaraQ: 'average' },
  { id: 'yama',          name: 'Yama',           x: 8, y: 5, w: 1, h: 1, ang: [168.75,180],  wall: 'E', dwaraQ: 'bad' },
  { id: 'gandharv',      name: 'Gandharv',       x: 8, y: 6, w: 1, h: 1, ang: [180,191.25],  wall: 'E', dwaraQ: 'good' },
  { id: 'bhringraj',     name: 'Bhringraj',      x: 8, y: 7, w: 1, h: 1, ang: [191.25,202.5],wall: 'E', dwaraQ: 'average' },
  { id: 'mrigha',        name: 'Mrigha',         x: 8, y: 8, w: 1, h: 1, ang: [202.5,213.75],wall: 'E', dwaraQ: 'average' },
  { id: 'pitru',         name: 'Pitr',           x: 1, y: 8, w: 1, h: 1, ang: [213.75,225],  wall: 'S', dwaraQ: 'bad' },
  { id: 'dauvarik',      name: 'Dauvarik',       x: 2, y: 8, w: 1, h: 1, ang: [225,236.25],  wall: 'S', dwaraQ: 'average' },
  { id: 'sugriv',        name: 'Sugriv',         x: 3, y: 8, w: 1, h: 1, ang: [236.25,247.5],wall: 'S', dwaraQ: 'good' },
  { id: 'pushpadant',    name: 'Pushpadant',     x: 4, y: 8, w: 1, h: 1, ang: [247.5,258.75],wall: 'S', dwaraQ: 'best' },
  { id: 'varun',         name: 'Varun',          x: 5, y: 8, w: 1, h: 1, ang: [258.75,270],  wall: 'S', dwaraQ: 'good' },
  { id: 'asur',          name: 'Asur',           x: 6, y: 8, w: 1, h: 1, ang: [270,281.25],  wall: 'S', dwaraQ: 'bad' },
  { id: 'shosh',         name: 'Shosh',          x: 7, y: 8, w: 1, h: 1, ang: [281.25,292.5],wall: 'S', dwaraQ: 'average' },
  { id: 'papiyaksha',    name: 'Papiyaksha',     x: 0, y: 8, w: 1, h: 1, ang: [292.5,303.75],wall: 'S', dwaraQ: 'bad' },
  { id: 'roga',          name: 'Roga',           x: 0, y: 7, w: 1, h: 1, ang: [303.75,315],  wall: 'W', dwaraQ: 'bad' },
  { id: 'naga',          name: 'Naga',           x: 0, y: 6, w: 1, h: 1, ang: [315,326.25],  wall: 'W', dwaraQ: 'bad' },
  { id: 'mukhya',        name: 'Mukhya',         x: 0, y: 5, w: 1, h: 1, ang: [326.25,337.5],wall: 'W', dwaraQ: 'good' },
  { id: 'bhallat',       name: 'Bhallat',        x: 0, y: 4, w: 1, h: 1, ang: [337.5,348.75],wall: 'W', dwaraQ: 'best' },
  { id: 'soma',          name: 'Soma',           x: 0, y: 3, w: 1, h: 1, ang: [348.75,360],  wall: 'W', dwaraQ: 'best' },
  { id: 'bhujag',        name: 'Bhujag',         x: 0, y: 2, w: 1, h: 1, ang: [0,11.25],     wall: 'W', dwaraQ: 'good' },
  { id: 'aditi',         name: 'Aditi',          x: 0, y: 1, w: 1, h: 1, ang: [11.25,22.5],  wall: 'W', dwaraQ: 'average' },
  { id: 'diti',          name: 'Diti',           x: 0, y: 0, w: 1, h: 1, ang: [22.5,33.75],  wall: 'W', dwaraQ: 'average' },
  { id: 'apah',          name: 'Apah',           x: 7, y: 1, w: 1, h: 1, ang: [45,90],  inner: true },
  { id: 'apah_vatsa',    name: 'Apah-vatsa',     x: 7, y: 2, w: 1, h: 1, ang: [45,90],  inner: true },
  { id: 'aryama',        name: 'Aryama',         x: 7, y: 3, w: 1, h: 3, ang: [90,135], inner: true },
  { id: 'savita',        name: 'Savita',         x: 7, y: 6, w: 1, h: 1, ang: [90,135], inner: true },
  { id: 'savitra',       name: 'Savitra',        x: 7, y: 7, w: 1, h: 1, ang: [90,135], inner: true },
  { id: 'vivaswan',      name: 'Vivaswan',       x: 3, y: 7, w: 3, h: 1, ang: [180,225],inner: true },
  { id: 'indra_inner',   name: 'Indra',          x: 2, y: 7, w: 1, h: 1, ang: [180,225],inner: true },
  { id: 'jaya',          name: 'Jaya',           x: 1, y: 7, w: 1, h: 1, ang: [180,225],inner: true },
  { id: 'mitra',         name: 'Mitra',          x: 1, y: 3, w: 1, h: 3, ang: [270,315],inner: true },
  { id: 'rudra',         name: 'Rudra',          x: 1, y: 2, w: 1, h: 1, ang: [270,315],inner: true },
  { id: 'rajayakshma',   name: 'Rājapaksha',     x: 1, y: 1, w: 1, h: 1, ang: [270,315],inner: true },
  { id: 'prithvi_dhara', name: 'Prithvi-dhara',  x: 3, y: 1, w: 3, h: 1, ang: [0,45],   inner: true },
  { id: 'brahma',        name: 'BRAHMA',         x: 3, y: 3, w: 3, h: 3, ang: [0,360],  center: true },
]

/* Deity Descriptions (scriptural + traditional) ─────────────────── */
const DEITY_DESC: Record<string, { desc: string; mantra: string; quality: string }> = {
  brahma:        { desc: 'The Absolute Creator — ruler of the Central Brahma Sthana. All 44 other deities radiate from this sacred center. A pure center amplifies every zone.', mantra: 'Oṃ Brahmane Namaḥ', quality: 'Creation, Consciousness, Cosmic Order' },
  shikhi:        { desc: 'The fire of creative impulse. Represents the spark of new ideas and pure inspiration from the cosmic ether.', mantra: 'Oṃ Shikhine Namaḥ', quality: 'Creativity, New Ideas, Inspiration' },
  parjanya:      { desc: 'The rain-giver deity. Brings fertility, sustenance, and the blessing of abundant rainfall into one\'s endeavors.', mantra: 'Oṃ Parjanyāya Namaḥ', quality: 'Fertility, Abundance, Life Force' },
  jayant:        { desc: 'The Victor — son of Indra. Activates this door position for assured victory and success in all competitive endeavors.', mantra: 'Oṃ Jayantāya Namaḥ', quality: 'Victory, Success, Achievement' },
  indra:         { desc: 'The King of Devas — ruler of the cardinal East direction. Bestows authority, management power, and royal patronage.', mantra: 'Oṃ Indrāya Namaḥ', quality: 'Authority, Management, Kingship' },
  surya:         { desc: 'Solar consciousness — governs integrity, visibility, and life-force. The Sun deity establishes social connectivity and health.', mantra: 'Oṃ Sūryāya Namaḥ', quality: 'Health, Recognition, Solar Power' },
  satya:         { desc: 'The deity of Truth. Activates goodwill, social reputation, and alignment with dharmic principles in all dealings.', mantra: 'Oṃ Satyāya Namaḥ', quality: 'Truth, Reputation, Social Goodwill' },
  bhrisha:       { desc: 'The deity of concentrated focus. Enables precision, intellectual clarity, and masterful execution of tasks.', mantra: 'Oṃ Bhṛśāya Namaḥ', quality: 'Focus, Precision, Intellectual Power' },
  antariksh:     { desc: 'The Inner Space deity — governs the bridge between physical and metaphysical realms. Opens pathways for spiritual realization.', mantra: 'Oṃ Antarikṣāya Namaḥ', quality: 'Spiritual Awareness, Inner Space, Subtle Perception' },
  agni:          { desc: 'The sacred Fire deity at the SE corner. Governs all transformative processes — digestion, metabolism, and financial flow.', mantra: 'Oṃ Agnaye Namaḥ', quality: 'Fire, Transformation, Cash Flow' },
  pusha:         { desc: 'The Nourisher — a solar deity who governs sustenance, progressive growth, and the ability to nourish all beings.', mantra: 'Oṃ Pūṣṇe Namaḥ', quality: 'Nourishment, Steady Growth, Provision' },
  vitatha:       { desc: 'The deity of versatility and creative performance. Activates skill in marketing, performance arts, and adaptability.', mantra: 'Oṃ Vitathāya Namaḥ', quality: 'Versatility, Performance, Marketing' },
  grihakshat:    { desc: 'The Household Manager — establishes clear boundaries, domestic order, and the energy of responsible governance.', mantra: 'Oṃ Gṛhakṣatāya Namaḥ', quality: 'Household Order, Boundaries, Management' },
  yama:          { desc: 'The Dharma-keeper and Lord of Death. As a door deity this position is avoided; as a zone it tests karmic alignment and justice.', mantra: 'Oṃ Yamāya Namaḥ', quality: 'Dharma, Justice, Karmic Law' },
  gandharv:      { desc: 'The Cosmic Musician of the heavens. This zone brings bliss, entertainment, artistic talent, and the energy of divine play.', mantra: 'Oṃ Gandharvāya Namaḥ', quality: 'Bliss, Arts, Entertainment, Relaxation' },
  bhringraj:     { desc: 'The Great Discriminator. Governs the art of analytical thinking, sorting what serves from what must be released.', mantra: 'Oṃ Bhṛṅgarājāya Namaḥ', quality: 'Analysis, Discrimination, Clarity' },
  mrigha:        { desc: 'The Seeker — the eternal spiritual hunger for knowledge, truth, and discovery. Activates curiosity and research ability.', mantra: 'Oṃ Mṛgāya Namaḥ', quality: 'Knowledge Seeking, Curiosity, Research' },
  pitru:         { desc: 'The Ancestor Portal. Connects with lineage energy, ancestral blessings, and the deep roots of generational karma.', mantra: 'Oṃ Pitṛbhyo Namaḥ', quality: 'Ancestry, Stability, Lineage Blessings' },
  dauvarik:      { desc: 'The Divine Gatekeeper. Filters energies, people, and opportunities that enter one\'s life and sphere of influence.', mantra: 'Oṃ Dauvarikāya Namaḥ', quality: 'Filtering, Protection, Access Control' },
  sugriv:        { desc: 'The Supportive Friend. Represents the power of strategic alliances, networking, and mutually beneficial relationships.', mantra: 'Oṃ Sugrīvāya Namaḥ', quality: 'Support, Networking, Strategic Alliances' },
  pushpadant:    { desc: 'The Blossoming Deity of financial abundance. This is one of the most auspicious entrance positions for business growth.', mantra: 'Oṃ Puṣpadantāya Namaḥ', quality: 'Financial Growth, Business Success, Abundance' },
  varun:         { desc: 'Lord of Cosmic Waters — governs all contracts, promises, and righteous agreements. The deity of divine law and water.', mantra: 'Oṃ Varuṇāya Namaḥ', quality: 'Contracts, Promises, Water, Divine Law' },
  asur:          { desc: 'The deity of hidden depths and shadow energy. Represents secrecy, internal strength, and dealing with the unseen.', mantra: 'Oṃ Asurāya Namaḥ', quality: 'Secrecy, Internal Strength, Shadow Work' },
  shosh:         { desc: 'The Great Purifier who dries out stagnation, depression, and inertia. Powerful healing energy for removing blocks.', mantra: 'Oṃ Śoṣāya Namaḥ', quality: 'Purification, Anti-stagnation, Depression Clearing' },
  papiyaksha:    { desc: 'The accumulation deity — represents unresolved karmic residue and mental blocks. Purification is needed in this zone.', mantra: 'Oṃ Pāpīyakṣāya Namaḥ', quality: 'Karmic Clearing, Mental Block Release' },
  roga:          { desc: 'The Healing Deity — where sickness is acknowledged, faced, and transformed. As entrance, avoided; as healing zone, beneficial.', mantra: 'Oṃ Rogāya Namaḥ', quality: 'Healing, Disease Transformation, Vitality' },
  naga:          { desc: 'The Serpent Deity of connectivity and kundalini energy. Governs the desire to reach out and weave connections.', mantra: 'Oṃ Nāgāya Namaḥ', quality: 'Connection, Kundalini, Serpentine Wisdom' },
  mukhya:        { desc: 'The Main Force — provides clarity of life direction and purpose. One of the auspicious western entrance positions.', mantra: 'Oṃ Mukhyāya Namaḥ', quality: 'Life Purpose, Direction, Clarity' },
  bhallat:       { desc: 'The Abundance Deity — bestows robust financial gains, physical health, and overflowing material prosperity.', mantra: 'Oṃ Bhallaṭāya Namaḥ', quality: 'Material Abundance, Health, Financial Gains' },
  soma:          { desc: 'The Moon deity — the divine nectar (Amrita). Brings deep refreshment, emotional nourishment, and blissful contentment.', mantra: 'Oṃ Somāya Namaḥ', quality: 'Moon Energy, Emotional Nourishment, Bliss' },
  bhujag:        { desc: 'The Endurance deity — governs mental stamina, persistence through challenges, and serpentine wisdom of the west.', mantra: 'Oṃ Bhujagāya Namaḥ', quality: 'Mental Stamina, Endurance, Persistence' },
  aditi:         { desc: 'The Mother of Gods — Aditi is the boundless cosmic mother who offers divine protection and unconditional security.', mantra: 'Oṃ Aditaye Namaḥ', quality: 'Divine Protection, Security, Boundless Love' },
  diti:          { desc: 'The Splitter — the power of conscious discernment, healthy separation, and the ability to make empowered choices.', mantra: 'Oṃ Ditaye Namaḥ', quality: 'Discernment, Separation, Empowered Choice' },
  apah:          { desc: 'The Healing Water deity — governs immunity, emotional purification, and the restoration of subtle body health.', mantra: 'Oṃ Adbhyaḥ Namaḥ', quality: 'Immunity, Emotional Healing, Purification' },
  apah_vatsa:    { desc: 'The divine carrier — transforms ideas from potential into manifestation through sustained and dedicated action.', mantra: 'Oṃ Apāṃ Vatsāya Namaḥ', quality: 'Manifestation, Carrying Ideas to Reality' },
  aryama:        { desc: 'The Noble Deity — patron of righteous marriage, sacred contracts, and mutually empowering support structures.', mantra: 'Oṃ Aryamṇe Namaḥ', quality: 'Marriage, Sacred Contracts, Noble Support' },
  savita:        { desc: 'The Divine Stimulator — ignites new projects, initiates fresh cycles, and provides the solar force of new beginnings.', mantra: 'Oṃ Savitre Namaḥ', quality: 'New Beginnings, Project Initiation, Solar Start' },
  savitra:       { desc: 'The Divine Radiator — spreads awareness, light, and righteous influence outward into the world and community.', mantra: 'Oṃ Sāvitrāya Namaḥ', quality: 'Spreading Awareness, Influence, Radiance' },
  vivaswan:      { desc: 'The Expansive Sun deity — governs social reach, public growth, and the expansion of one\'s sphere of influence.', mantra: 'Oṃ Vivasvate Namaḥ', quality: 'Social Expansion, Public Growth, Community' },
  indra_inner:   { desc: 'Inner executive power — the internal Indra that manages inner affairs with decisive authority and clear judgment.', mantra: 'Oṃ Indrāya Namaḥ', quality: 'Executive Power, Inner Authority, Decision-making' },
  jaya:          { desc: 'The Mastery deity — bestows the energy of skill mastery, craft excellence, and the achievement of technical perfection.', mantra: 'Oṃ Jayāya Namaḥ', quality: 'Skill Mastery, Craft Excellence, Achievement' },
  mitra:         { desc: 'The Universal Friend — governs peaceful diplomacy, cooperative relationships, and the art of harmonious co-existence.', mantra: 'Oṃ Mitrāya Namaḥ', quality: 'Universal Friendship, Peace, Harmonious Relations' },
  rudra:         { desc: 'The Transformer — the healing-destroyer aspect of Shiva. Breaks old patterns and initiates profound purification.', mantra: 'Oṃ Rudrāya Namaḥ', quality: 'Transformation, Pattern Breaking, Purification' },
  rajayakshma:   { desc: 'The Consumption deity — governs the enjoyment of royal pleasures, luxury experiences, and the refinement of taste.', mantra: 'Oṃ Rājayakṣmāya Namaḥ', quality: 'Luxury, Refined Pleasures, Royal Enjoyment' },
  prithvi_dhara: { desc: 'The Foundation deity — governs structural stability, earth energy, and the solid grounding that supports all endeavors.', mantra: 'Oṃ Pṛthvīdhārāya Namaḥ', quality: 'Foundation, Structural Stability, Earth Energy' },
}

/* Navagraha — Vedic 9-planet directional zones ──────────────────── */
const NAVAGRAHA_ZONES = [
  { planet: 'Su', name: 'Sūrya (Sun)',     dir: 'E',   en: 'East',       qual: 'Authority, health, social recognition, leadership', color: '#FF8C00', remedy: 'Copper Surya Yantra, Red flowers, Wheat offering', mantra: 'Oṃ Hrāṃ Hrīṃ Hraum Sah Sūryāya Namaḥ' },
  { planet: 'Mo', name: 'Chandra (Moon)',  dir: 'NW',  en: 'North-West', qual: 'Emotions, mind, relationships, fluidity, intuition', color: '#C0C0C0', remedy: 'Silver Moon Yantra, White flowers, Rice offering',  mantra: 'Oṃ Śrāṃ Śrīṃ Śraum Sah Chandrāya Namaḥ' },
  { planet: 'Ma', name: 'Maṅgala (Mars)',  dir: 'S',   en: 'South',      qual: 'Courage, property, brothers, energy, assertion',     color: '#DC143C', remedy: 'Copper Mangal Yantra, Red lentils, Triangular items', mantra: 'Oṃ Krāṃ Krīṃ Kraum Sah Bhaum Namaḥ' },
  { planet: 'Me', name: 'Budha (Mercury)', dir: 'N',   en: 'North',      qual: 'Business, communication, intellect, commerce',        color: '#228B22', remedy: 'Green Emerald, Copper Mercury Yantra, Green gram',   mantra: 'Oṃ Brāṃ Brīṃ Braum Sah Budhāya Namaḥ' },
  { planet: 'Ju', name: 'Guru (Jupiter)',  dir: 'NE',  en: 'North-East', qual: 'Wisdom, children, spiritual growth, expansion',       color: '#DAA520', remedy: 'Gold Jupiter Yantra, Yellow sapphire, Turmeric',     mantra: 'Oṃ Grāṃ Grīṃ Graum Sah Guruve Namaḥ' },
  { planet: 'Ve', name: 'Śukra (Venus)',   dir: 'SE',  en: 'South-East', qual: 'Wealth, beauty, luxury, relationships, arts',         color: '#FF69B4', remedy: 'Silver Venus Yantra, White flowers, Sugar offering',  mantra: 'Oṃ Drāṃ Drīṃ Draum Sah Śukrāya Namaḥ' },
  { planet: 'Sa', name: 'Śani (Saturn)',   dir: 'W',   en: 'West',       qual: 'Discipline, longevity, service, karma, patience',     color: '#4169E1', remedy: 'Iron Shani Yantra, Blue sapphire, Sesame seeds',      mantra: 'Oṃ Prāṃ Prīṃ Praum Sah Śanaye Namaḥ' },
  { planet: 'Ra', name: 'Rāhu',            dir: 'SW',  en: 'South-West', qual: 'Material ambition, foreign, technology, illusion',    color: '#800080', remedy: 'Lead Rahu Yantra, Coconut, Hassonite Garnet',         mantra: 'Oṃ Bhrāṃ Bhrīṃ Bhraum Sah Rāhave Namaḥ' },
  { planet: 'Ke', name: 'Ketu',            dir: 'NNE', en: 'North-NE',   qual: 'Spirituality, liberation, past karma, occult',        color: '#808080', remedy: 'Iron Ketu Yantra, Cat\'s Eye, Sesame & black items',   mantra: 'Oṃ Srāṃ Srīṃ Sraum Sah Ketave Namaḥ' },
]

/* Vastu Doshas — from Manasara, Mayamata, Vishwakarma Prakash ───── */
const VASTU_DOSHAS = [
  {
    id: 'brahma-dosha', name: 'Brahma Sthana Dosha', severity: 'critical', zone: 'Center',
    desc: 'Central area obstructed by pillar, heavy beam, toilet, staircase, or wall. The most severe Vastu defect.',
    effect: 'Confusion, poor decisions, chronic family disharmony, central nervous system issues, leadership failure.',
    remedy: 'Keep the central 1/9th area completely open. Place a Vastu Purush Yantra (copper) in the center. Install crystal sphere or Swastik symbol. Never drill marma points.',
    scripture: 'Manasara (Ch. 14): "The center of the site is sacred as the sky itself. Any construction here invites cosmic displeasure."',
    checkFn: () => true,
  },
  {
    id: 'ishan-dosha', name: 'Ishan (NE) Dosha', severity: 'high', zone: 'NE',
    desc: 'North-East corner is cut, lowered, has toilet, kitchen, heavy structure, or fire element.',
    effect: 'Loss of wisdom, mental disturbance, health deterioration, blocked spiritual growth, strained finances.',
    remedy: 'Keep NE clear and light. Place water body or fountain. Install copper Shri Yantra or clear quartz crystal. Perform daily water puja in NE.',
    scripture: 'Brihat Samhita (53.76): "Ishan belongs to Isha (Shiva). Affliction here causes suffering to the master of the house, his wisdom and health."',
    checkFn: () => true,
  },
  {
    id: 'agni-dosha', name: 'Agni (SE) Dosha', severity: 'medium', zone: 'SE',
    desc: 'South-East has water body, toilet, or the corner is missing/extended south.',
    effect: 'Cash flow disruption, digestive disorders, fire accidents, financial anxiety, confidence issues.',
    remedy: 'Place triangular red items, fire lamp (Akhand Jyoti), copper pyramid in SE. Avoid water storage in SE completely.',
    scripture: 'Vishwakarma Prakash: "Agni in the SE is the sustainer of wealth. Water opposing fire here destroys the treasury."',
    checkFn: () => true,
  },
  {
    id: 'nairiti-dosha', name: 'Nairiti (SW) Dosha', severity: 'high', zone: 'SW',
    desc: 'South-West corner is open, low, has main entrance, missing, or has a water body.',
    effect: 'Instability, relationship breakdowns, skill decline, frequent relocation, loss of accumulated wealth.',
    remedy: 'Add height and weight to SW. Place heavy furniture or rock garden. Use yellow and brown colors. Plant a Banyan tree if space permits.',
    scripture: 'Manasara: "Nirriti rules the SW with the weight of the Earth. An open SW is like a ship without an anchor — all gains are lost."',
    checkFn: () => true,
  },
  {
    id: 'vayu-dosha', name: 'Vayu (NW) Dosha', severity: 'medium', zone: 'NW',
    desc: 'North-West is excessively open, lacks support, or has heavy construction creating NW extension.',
    effect: 'Lack of support from others, unstable relationships, erratic income, dependency and anxiety.',
    remedy: 'Balance NW with metallic wind chimes (7-rod). White/silver colors. Moderately open — not too heavy, not too empty.',
    scripture: 'Vastu Vidya Granth: "Vayu Kona governs all supportive relationships. Imbalance brings the wind of isolation and financial instability."',
    checkFn: () => true,
  },
  {
    id: 'veedhi-shoola', name: 'Veedhi Shoola (Road Hit)', severity: 'high', zone: 'Any wall',
    desc: 'A road or pathway directly hits/aims at any face or corner of the property.',
    effect: 'Accidents, sudden losses, legal challenges, high-pressure health issues, obstacles in career.',
    remedy: 'Install Vastu Kavach. Plant dense trees or bamboo as buffer. Place protective mirror (facing road). Install Hanuman Yantra on affected wall.',
    scripture: 'Mayamata (Ch. 6): "Roads converging at a point create Veedhi Shoola — they pierce the property like a spear, draining its vital force."',
    checkFn: () => true,
  },
  {
    id: 'underground-water', name: 'Underground Water Dosha', severity: 'medium', zone: 'SW, S, SE',
    desc: 'Underground water storage, boring well, or septic tank in the SW, S, or SE zones.',
    effect: 'Destabilization of earth energy, financial draining, health issues related to water-borne ailments.',
    remedy: 'Relocate water storage to NE, N, or E zones. Place Varun Yantra near water source. Perform Vastu Shanti puja.',
    scripture: 'Samarangana Sutradhara (Ch. 19): "Water flowing beneath the SW erodes the foundation of the household, both literal and metaphorical."',
    checkFn: () => true,
  },
  {
    id: 'staircase-dosha', name: 'Staircase Direction Dosha', severity: 'low', zone: 'NE, Center',
    desc: 'Main staircase located in the North-East or exact center of the property.',
    effect: 'Heavy energy in wisdom/health zone (NE) or sacred center causes mental restlessness and health issues.',
    remedy: 'Best staircase positions: S, SW, W, NW. Place Sri Yantra near NE staircase. Keep area well-lit.',
    scripture: 'Vastu Shastra: "The staircase of a house should always climb toward the South or West, never toward the sacred Ishan (NE) corner."',
    checkFn: () => true,
  },
]

/* 16 Marma Points — energy meridians that must not be pierced ───── */
const MARMA_POINTS = [
  { id: 'm1',  name: 'Brahma Marma',    pos: 'Exact Center',            desc: 'Supreme — never drill, bore, or place heavy object here' },
  { id: 'm2',  name: 'Ishan Marma',     pos: 'NE corner junction',      desc: 'Head of Vastu Purusha — keep open and sacred' },
  { id: 'm3',  name: 'Indra Marma',     pos: 'North-center junction',   desc: 'Career energy channel — avoid heavy cutting' },
  { id: 'm4',  name: 'Surya Marma',     pos: 'East-center junction',    desc: 'Solar meridian — avoid shadow-casting objects' },
  { id: 'm5',  name: 'Agni Marma',      pos: 'SE corner junction',      desc: 'Fire energy node — no water bodies here' },
  { id: 'm6',  name: 'Yama Marma',      pos: 'South-center junction',   desc: 'Dharma channel — avoid main entrance' },
  { id: 'm7',  name: 'Nirriti Marma',   pos: 'SW corner junction',      desc: 'Earth anchor — never open or lower this corner' },
  { id: 'm8',  name: 'Varuna Marma',    pos: 'West-center junction',    desc: 'Water law node — avoid blocking' },
  { id: 'm9',  name: 'Vayu Marma',      pos: 'NW corner junction',      desc: 'Air node — balance, not too heavy/light' },
  { id: 'm10', name: 'Soma Marma',      pos: 'Mid-West wall inner',     desc: 'Moon nectar point — keep nourished and cool' },
  { id: 'm11', name: 'Bhallat Marma',   pos: 'Upper-West inner',        desc: 'Abundance node — do not obstruct' },
  { id: 'm12', name: 'Mukhya Marma',    pos: 'Central-West inner',      desc: 'Direction node — keep pathways clear' },
  { id: 'm13', name: 'Savita Marma',    pos: 'Mid-East inner',          desc: 'Initiation node — allow morning light' },
  { id: 'm14', name: 'Vivaswan Marma',  pos: 'Lower-East inner',        desc: 'Expansion node — no permanent furniture' },
  { id: 'm15', name: 'Mitra Marma',     pos: 'Central-South inner',     desc: 'Friendship node — keep warm and welcoming' },
  { id: 'm16', name: 'Prithvi Marma',   pos: 'Mid-North inner',         desc: 'Earth foundation node — structural care' },
]

/* Yantra Placement Guide (Tantric Vastu tradition) ──────────────── */
const YANTRA_GUIDE = [
  { yantra: 'Vastu Purush Yantra',    zone: 'Center (Brahma Sthana)', mat: 'Copper', timing: 'Sunday Sunrise', purpose: 'Master remedy — balances all 45 deities, removes all Vastu doshas simultaneously' },
  { yantra: 'Shri Yantra (Sri Chakra)',zone: 'NE, Pooja Room',        mat: 'Gold or Copper', timing: 'Friday Sunrise', purpose: 'Supreme Lakshmi yantra — overall prosperity, cosmic beauty, divine grace' },
  { yantra: 'Kuber Yantra',           zone: 'North (N)',              mat: 'Gold or Brass', timing: 'Monday (Shukla Paksha)', purpose: 'Treasury activation, Kubera blessing, steady financial growth' },
  { yantra: 'Surya Yantra',           zone: 'East (E)',               mat: 'Copper', timing: 'Sunday Sunrise', purpose: 'Solar health, authority, recognition, leadership energy' },
  { yantra: 'Chandra Yantra',         zone: 'North-West (NW)',        mat: 'Silver', timing: 'Monday (Purnima)', purpose: 'Mind peace, emotional balance, relationship harmony' },
  { yantra: 'Mangal Yantra',          zone: 'South (S), SE',          mat: 'Copper (triangular)', timing: 'Tuesday', purpose: 'Property protection, courage, defeat of enemies, fire energy' },
  { yantra: 'Budha Yantra',           zone: 'North (N)',              mat: 'Gold or Brass', timing: 'Wednesday', purpose: 'Business success, communication, intellectual sharpness' },
  { yantra: 'Guru Yantra',            zone: 'NE, Study Room',         mat: 'Gold', timing: 'Thursday Sunrise', purpose: 'Wisdom, children\'s education, spiritual evolution, guru blessings' },
  { yantra: 'Shukra Yantra',          zone: 'SE, Bedroom',            mat: 'Silver', timing: 'Friday', purpose: 'Wealth attraction, beauty, luxury, relationship harmony' },
  { yantra: 'Shani Yantra',           zone: 'West (W), SW',           mat: 'Iron or Lead', timing: 'Saturday', purpose: 'Saturn pacification, longevity, discipline, removal of karma' },
  { yantra: 'Rahu Yantra',            zone: 'SW',                     mat: 'Lead', timing: 'Saturday Night', purpose: 'Rahu pacification, foreign success, technology, hidden gains' },
  { yantra: 'Ketu Yantra',            zone: 'NNE',                    mat: 'Iron', timing: 'Saturday', purpose: 'Ketu pacification, spiritual liberation, occult protection' },
]

/* Metal & Element Remedies by Direction ─────────────────────────── */
const METAL_REMEDIES = [
  { dir: 'N',   metal: 'Zinc / Silver',     bhuta: 'Jal (Water)',    color: '#3b82f6', items: 'Silver bowl, blue sapphire, water container, aquamarine crystal', avoid: 'Fire elements, red colors, sharp metal objects' },
  { dir: 'NE',  metal: 'Gold',              bhuta: 'Jal (Water)',    color: '#f59e0b', items: 'Gold coins, quartz crystal, Shri Yantra, clear water vessel', avoid: 'Toilet, heavy structures, kitchen, fire' },
  { dir: 'E',   metal: 'Copper',            bhuta: 'Vayu (Air)',     color: '#10b981', items: 'Copper pot, green plants, wooden items, sunlight mirror', avoid: 'Iron, heavy stone, dark colors' },
  { dir: 'SE',  metal: 'Copper / Bronze',   bhuta: 'Agni (Fire)',    color: '#ef4444', items: 'Brass pyramid, red triangle, fire lamp (Akhand Jyoti), camphor', avoid: 'Water, blue colors, underground storage' },
  { dir: 'S',   metal: 'Brass / Bronze',    bhuta: 'Agni (Fire)',    color: '#dc2626', items: 'Brass items, yellow earthen pots, red/orange colors, Yama lamp', avoid: 'Main entrance (inauspicious), open space' },
  { dir: 'SW',  metal: 'Lead / Iron',       bhuta: 'Prithvi (Earth)',color: '#d97706', items: 'Heavy stone slab, yellow crystals, iron stand, large earthen pots', avoid: 'Open corner, low structure, water body, main door' },
  { dir: 'W',   metal: 'Iron / Steel',      bhuta: 'Akasha (Space)', color: '#6b7280', items: 'Iron wind chime, metal sculpture, grey stones, lead pyramid', avoid: 'Nothing — balanced use of all metals OK' },
  { dir: 'NW',  metal: 'Silver / White Metal',bhuta: 'Vayu (Air)',   color: '#94a3b8', items: '7-rod metal wind chime, white curtains, silver bowl, white flowers', avoid: 'Heavy stone, excessive construction, dark earth colors' },
]

/* Plant Vastu (Vastu Vriksha Shastra) ───────────────────────────── */
const VASTU_PLANTS = [
  { plant: 'Tulsi (Ocimum sanctum)',  zone: 'N, NE, E',  benefit: 'Purifies 200m radius, divine Vishnu blessing, enhances Ishan wisdom energy', avoid: 'SW, S — diminishes earth element' },
  { plant: 'Banana (Kadalī)',         zone: 'NE',         benefit: 'Jupiter (Guru) energy, auspiciousness, fertility, puja blessing', avoid: 'SE, S — reduces fire confidence' },
  { plant: 'Coconut (Śrīphala)',      zone: 'N, NW',      benefit: 'Kubera tree of prosperity, auspiciousness, brings Lakshmi into home', avoid: 'SW center — blocks earth stability' },
  { plant: 'Neem (Azadirachta)',      zone: 'NW, W',      benefit: 'Purifies air, removes Vayu dosha, powerful antibacterial spiritual aura', avoid: 'NE, N — blocks water and wisdom energy' },
  { plant: 'Ashoka (Saraca asoca)',   zone: 'E, SE',      benefit: 'Sun energy, removes grief (a-shoka), auspicious for couples, solar power', avoid: 'NW, N — wrong element for water zones' },
  { plant: 'Bamboo (Lucky)',          zone: 'E, SE',      benefit: 'Rapid growth, strength, absorbs electromagnetic negativity', avoid: 'SW — creates instability in earth zone' },
  { plant: 'Mogra / Jasmine',         zone: 'N, W',       benefit: 'Moon energy, fragrance purifies subtle body, emotional wellbeing, devotion', avoid: 'SE — wrong for fire zone' },
  { plant: 'Money Plant (Pothos)',    zone: 'SE',         benefit: 'Venus (Shukra) energy, cash flow activation, financial abundance', avoid: 'NE — slows spiritual clarity and wisdom' },
  { plant: 'Lotus (Padma)',           zone: 'NE, N',      benefit: 'Supreme auspiciousness, Lakshmi seat, purity, spiritual elevation', avoid: 'SW, S — fire conflict' },
  { plant: 'Aloe Vera',              zone: 'N, NE',      benefit: 'Healing energy, purifies air, Jal element balance, health protection', avoid: 'SE, SW — reduces earth and fire quality' },
]

/* Sleeping Direction (Shayana Vidhi) — Charaka Samhita & Vastu ─── */
const SLEEP_DIRECTIONS = [
  { head: 'South', quality: 'best',    icon: '⭐⭐⭐', col: '#10b981', desc: 'Recommended for all. Aligns body\'s bio-magnetic north with Earth\'s south pole (same polarity = repulsion = sound, restful sleep). Long life, health, prosperity and undisturbed sleep.' },
  { head: 'East',  quality: 'good',    icon: '⭐⭐',   col: '#f59e0b', desc: 'Excellent for students, scholars, and spiritual seekers. Solar energy enters from head, increasing intelligence, spiritual clarity, and fresh morning energy. Promotes learning.' },
  { head: 'West',  quality: 'average', icon: '⭐',    col: '#94a3b8', desc: 'Moderate direction. Promotes fame-seeking and social ambitions. May cause restlessness or vivid dreams. Used for those working in public life or arts.' },
  { head: 'North', quality: 'bad',     icon: '✗',    col: '#ef4444', desc: 'Strictly avoided in Vedic tradition. Earth\'s magnetic north pole creates opposing field to body\'s north, causing: disturbed sleep, poor memory, health issues, mental unrest, and chronic fatigue.' },
]

/* Panchabhutas and their Vastu zones, qualities, enhancement ────── */
const PANCHA_BHUTAS = [
  { bhuta: 'Prithvi', name: 'Earth', zones: ['SW', 'S', 'W', 'SE'], qual: 'Stability, weight, patience, endurance, rootedness', color: '#d97706', enhance: 'Heavy stone, yellow/brown colors, low furniture, earthen pottery, lead/iron', icon: '⛰️' },
  { bhuta: 'Jal',     name: 'Water', zones: ['N', 'NE', 'NNE'],     qual: 'Flow, clarity, opportunities, purity, healing, creativity', color: '#3b82f6', enhance: 'Water fountain, aquarium, blue/silver colors, copper bowl with water, crystals', icon: '🌊' },
  { bhuta: 'Agni',    name: 'Fire',  zones: ['SE', 'SSE', 'E'],     qual: 'Energy, passion, transformation, digestion, confidence, cash', color: '#ef4444', enhance: 'Fire lamp, candles, red/orange colors, copper items, triangular shapes', icon: '🔥' },
  { bhuta: 'Vayu',    name: 'Air',   zones: ['NW', 'WNW', 'NNW', 'NE'], qual: 'Movement, speed, support, breath, communication, connections', color: '#10b981', enhance: 'Wind chimes, fans, light curtains, green plants, silver metal, open windows', icon: '🌬️' },
  { bhuta: 'Akasha',  name: 'Space', zones: ['W', 'WSW', 'Center'], qual: 'Expansion, consciousness, gains, sound, liberation, meditation', color: '#8b5cf6', enhance: 'Open space, crystals, sound bowls, grey/purple colors, no clutter, silence', icon: '✨' },
]

/* Prana Vayu — 5 life force currents mapped to zones ────────────── */
const PRANA_VAYU_MAP = [
  { vayu: 'Prāṇa Vāyu',  dir: 'NE, NNE', func: 'Inward & upward force. Governs intake — breath, food, knowledge, perception. Life force entry point.', color: '#f59e0b' },
  { vayu: 'Apāna Vāyu',  dir: 'SE, ESE, WSW', func: 'Downward & outward force. Governs elimination, disposal, letting go. Exit of waste energy.', color: '#ef4444' },
  { vayu: 'Samāna Vāyu', dir: 'S, SSW, SW', func: 'Equalizing force. Governs digestion, assimilation, balance between intake and output.', color: '#d97706' },
  { vayu: 'Udāna Vāyu',  dir: 'N, WNW, NW', func: 'Upward force. Governs speech, expression, growth, ascent, evolution, and consciousness uplift.', color: '#3b82f6' },
  { vayu: 'Vyāna Vāyu',  dir: 'E, ENE, W', func: 'Pervasive force. Governs circulation, distribution, expansion throughout the entire space.', color: '#10b981' },
]

/* Ashta Dikpalas — 8 Directional Guardians ─────────────────────── */
const DIKPALAS = [
  { dir: 'N',  deity: 'Kubera',   power: 'Wealth, Treasury',    weapon: 'Gadā (mace)', mount: 'Man (human)', color: '#f59e0b', puja: 'Monday' },
  { dir: 'NE', deity: 'Īśāna',   power: 'Wisdom, Divine Grace', weapon: 'Triśūla',    mount: 'Bull (Nandi)', color: '#8b5cf6', puja: 'Monday' },
  { dir: 'E',  deity: 'Indra',   power: 'Rain, Sovereignty',    weapon: 'Vajra',      mount: 'Airāvata (elephant)', color: '#DAA520', puja: 'Thursday' },
  { dir: 'SE', deity: 'Agni',    power: 'Fire, Transformation', weapon: 'Śakti',      mount: 'Ram (meṣa)',  color: '#ef4444', puja: 'Tuesday' },
  { dir: 'S',  deity: 'Yama',    power: 'Dharma, Death',        weapon: 'Daṇḍa',      mount: 'Buffalo',     color: '#1f2937', puja: 'Saturday' },
  { dir: 'SW', deity: 'Nirṛiti', power: 'Dissolution, Stability',weapon: 'Khaḍga',    mount: 'Corpse/Lion', color: '#7c3aed', puja: 'Saturday' },
  { dir: 'W',  deity: 'Varuṇa',  power: 'Water, Cosmic Law',    weapon: 'Pāśa (lasso)',mount: 'Makara (crocodile)', color: '#3b82f6', puja: 'Friday' },
  { dir: 'NW', deity: 'Vāyu',   power: 'Wind, Speed',          weapon: 'Dhvaja (flag)',mount: 'Deer (mṛga)', color: '#10b981', puja: 'Wednesday' },
]

/* ─── Helpers ─────────────────────────────────────────────────────── */
const ELEM_ICON: Record<string, string>  = { Jal: '🌊', Agni: '🔥', Vayu: '🌬️', Prithvi: '⛰️', Akasha: '✨', Water: '🌊', Fire: '🔥', Air: '🌬️', Earth: '⛰️', Space: '✨' }
const ELEM_COLOR: Record<string, string> = { Jal: '#3b82f6', Agni: '#ef4444', Vayu: '#10b981', Prithvi: '#d97706', Akasha: '#8b5cf6', Water: '#3b82f6', Fire: '#ef4444', Air: '#10b981', Earth: '#d97706', Space: '#8b5cf6' }

/* ══════════════════════════════════════════════════════════════════
   ASTRO-VASTU SYNTHESIS DATA
   Source: Astro Vastu — Classical Vedic Synthesis
   Combining Vedic Jyotish (Kundali) with Vastu Shastra spatial science
   ══════════════════════════════════════════════════════════════════ */

/* 12 Bhavas (Houses) — Significance, Spatial Zone & Room Mapping ── */
const BHAVA_MAP = [
  { h: 1,  name: 'Tanu Bhava',   eng: 'Self & Health',       dir: 'E',   room: 'Main Entrance / Façade',        icon: '🧍', color: '#f59e0b',
    signifies: 'Body, personality, overall health, head, self-image, initiative, vitality',
    spatial: 'The East wall and main entrance represent the Lagna — the face of the house. This zone governs how energy enters the property.',
    activate: 'Keep East entrance bright, clean and unobstructed. Plant sunflowers or tulsi near the main door.',
    lord_tip: 'If 1st lord is strong in its own/exaltation sign, the East zone energises naturally. Weak 1st lord → prioritise East wall remedies.',
    professions: ['Self-driven professions', 'Fitness & wellness', 'Medicine', 'Psychiatry', 'Politics'] },
  { h: 2,  name: 'Dhan Bhava',   eng: 'Family & Wealth',     dir: 'SE',  room: 'Kitchen / Treasury / Dining',    icon: '💰', color: '#ef4444',
    signifies: 'Family, accumulated wealth, speech, food habits, bank balance, face, neck, liquid assets',
    spatial: 'SE zone governs cash flow and family sustenance. Kitchen in SE channels Agni (fire energy) for financial metabolism.',
    activate: 'Maintain kitchen stove in SE. Keep financial documents and lockers in a clean, energised SE area.',
    lord_tip: '2nd lord in benefic houses (1,4,5,9,10,11) → good wealth flow. Malefic placement → remediate SE with Agni deepam and copper pyramids.',
    professions: ['Banking & Finance', 'Jewellery', 'Food industry', 'Wealth management', 'Family business'] },
  { h: 3,  name: 'Vikrama Bhava', eng: 'Efforts & Siblings',  dir: 'S',   room: 'Gym / Study / Hobby Room',      icon: '💪', color: '#dc2626',
    signifies: 'Efforts, younger siblings, neighbours, communication, courage, short travel, planning, arms, shoulders',
    spatial: 'South direction channels Mars energy — force, courage and willpower. Gym or activity spaces here multiply personal energy.',
    activate: 'Place exercise equipment in S or SSE. Motivational symbols, trophies. Keep S wall solid and supportive.',
    lord_tip: '3rd lord well-placed → self-made success. Poor placement → south zone needs Mars yantra and red coral energisation.',
    professions: ['Online business', 'Marketing & Sales', 'Media', 'Agency/Franchise', 'IT work', 'Tour & Travel'] },
  { h: 4,  name: 'Sukha Bhava',  eng: 'Home & Comfort',      dir: 'SW',  room: 'Master Bedroom / Living Room',  icon: '🏠', color: '#7c3aed',
    signifies: 'Mother, home, mental peace, emotions, luxuries (property & vehicles), domestic comfort, heart, education',
    spatial: 'SW is the most stable directional zone — earth element dominates. Master bedroom here ensures grounding and restful sleep for the family head.',
    activate: 'Master bedroom in SW with head facing South or East. Keep SW heavy (wardrobes, stone furniture). No bathroom or toilet in SW.',
    lord_tip: '4th lord strong → domestic happiness. Afflicted 4th lord → SW needs Rahu/Ketu remedies plus blue sapphire energisation.',
    professions: ['Real estate & Vastu', 'Hospitality', 'Education', 'Work from home', 'Agriculture'] },
  { h: 5,  name: 'Putra Bhava',  eng: 'Creativity & Children', dir: 'W', room: "Children's Room / Entertainment", icon: '🎨', color: '#3b82f6',
    signifies: 'Education, children, love, creativity, intelligence, sports, stock market, solutions, healing',
    spatial: 'West zone (Saturn) gives results of effort. Children\'s rooms and creative spaces here harvest the fruits of intellectual labour.',
    activate: 'Children\'s bedroom in W or NW. Study desk facing East or North. Entertainment room in W. Avoid heavy storage here.',
    lord_tip: '5th lord exalted → exceptional creativity and children\'s success. Debilitated → W zone needs Jupiter yantra, yellow sapphire grid.',
    professions: ['Education & Teaching', 'Creative design', 'Stock market', 'Healing arts', 'Drama & Acting', 'Sports'] },
  { h: 6,  name: 'Rog Bhava',   eng: 'Health & Service',    dir: 'NW',  room: 'Bathroom / Utility / Staff Room', icon: '⚕️', color: '#10b981',
    signifies: 'Obstacles, diseases, enemies, debts, litigation, service, discipline, job, hard work',
    spatial: 'NW zone (Moon-Vayu) supports movement, service and helpful people. Utility areas here keep disease energy in its correct spatial quarter.',
    activate: 'Bathroom in NW or W. Servant quarters in NW. Keep this zone airy and well-ventilated. No main entrance in exact NW.',
    lord_tip: '6th lord in 1/6/11 → service success. In 4/7 → domestic or partnership disputes. Remediate NW with white metals and Vayu yantra.',
    professions: ['Doctors & Lawyers', 'Financial services', 'Government service', 'Healthcare', 'Military & Police'] },
  { h: 7,  name: 'Kalatra Bhava', eng: 'Partnership & Marriage', dir: 'N', room: 'Business Corner / Guest Room',  icon: '🤝', color: '#f59e0b',
    signifies: 'Spouse, business partners, daily interactions, customers, retail business, marital relations, business place',
    spatial: 'North zone (Mercury) governs new opportunities and partnerships. Guest room and business entrance in North activate relationship energy.',
    activate: 'Guest bedroom in NW or NE. Business cabin facing North. Keep North zone open, uncluttered and well-lit.',
    lord_tip: '7th lord strong → flourishing partnerships. Malefic 7th lord → N zone needs Mercury yantra, green aventurine grid.',
    professions: ['Retail business', 'Customer service', 'Partnerships', 'Consultancy', 'Trading'] },
  { h: 8,  name: 'Randhra Bhava', eng: 'Transformation & Research', dir: 'NNE', room: 'Safe / Underground Storage',  icon: '🔬', color: '#8b5cf6',
    signifies: 'Unknown aspects, longevity, transformation, in-laws, unearned money, research, occult, surgery, hidden forces',
    spatial: 'NNE zone governs Ketu\'s energy — hidden, transformative. Underground spaces, safes and research corners belong here.',
    activate: 'Keep NNE zone clean and sacred. Appropriate for meditation or a small mandir. Avoid heavy plumbing or waste here.',
    lord_tip: '8th lord in kendra/trikona with benefic aspect → research success. Malefic → NNE needs Ketu puja and white crystal grid.',
    professions: ['Research & Analytics', 'Taxation', 'Engineering', 'Insurance', 'Astrology', 'Surgery', 'Technology'] },
  { h: 9,  name: 'Bhagya Bhava', eng: 'Fortune & Spirituality', dir: 'NE', room: 'Puja Room / Library / Guru Corner', icon: '🙏', color: '#DAA520',
    signifies: 'Luck, divine grace, father, guru, spirituality, religion, higher education, foreign travel, philosophical wisdom',
    spatial: 'NE is the supreme zone — Ishan corner, the abode of Shiva/Jupiter. Puja room here maximises divine blessings and fortune.',
    activate: 'Puja room must be in NE. Library or sacred books in NE/N. No kitchen, toilet or heavy storage in NE. Keep light and open.',
    lord_tip: '9th lord exalted (Jupiter in Cancer, Sun in Aries) → exceptional fortune. Afflicted → NE must be deeply purified and energised.',
    professions: ['Teaching & Consultancy', 'Spiritual work', 'Immigration services', 'Religious institutions', 'Higher education'] },
  { h: 10, name: 'Karma Bhava',  eng: 'Career & Status',     dir: 'ENE', room: 'Home Office / Study / Professional Space', icon: '💼', color: '#f97316',
    signifies: 'Profession, social status, administration, politics, government, identity, authority, career ambitions',
    spatial: 'ENE zone (Sun-East) energises the professional drive. Home office or study facing this direction amplifies career success.',
    activate: 'Office desk facing ENE or N. Place professional awards, diplomas and career symbols here. Avoid clutter in professional space.',
    lord_tip: '10th lord in Lagna or Kendra → stellar career. Afflicted → home office in ENE needs Sun yantra and Ruby energisation.',
    professions: ['All professions', 'Government jobs', 'Administration', 'Politics', 'Business leadership'] },
  { h: 11, name: 'Labha Bhava',  eng: 'Gains & Social Circle', dir: 'NNW', room: 'Garden / Outdoor Space / Social Area', icon: '🌟', color: '#22c55e',
    signifies: 'Profits, friends, big organisations, NGOs, wish fulfillment, elder siblings, social networks, victory',
    spatial: 'NNW zone (Mercury-Vayu) governs attraction and incoming desires. Outdoor entertaining areas here magnetise gains and friendships.',
    activate: 'Garden parties, outdoor seating in NNW. Wind chimes in NNW attract helpful contacts. Social/family events in this zone.',
    lord_tip: '11th lord strong → large gains with less effort. In 12th → gains from foreign sources. Activate NNW with Rahu yantra and silver.',
    professions: ['Big organisations', 'NGOs & Clubs', 'Community services', 'Network marketing', 'Cooperative societies'] },
  { h: 12, name: 'Vyaya Bhava',  eng: 'Isolation & Liberation', dir: 'WNW', room: 'Meditation Room / Guest Bedroom / Foreign',icon: '🧘', color: '#6366f1',
    signifies: 'Isolation, foreign settlement, spiritual liberation, expenditure, losses, meditation, charity, hospitals',
    spatial: 'WNW zone governs detachment and higher surrender. Meditation rooms and guest bedrooms for foreign visitors here support spiritual progress.',
    activate: 'Meditation corner in WNW or NW. Avoid using WNW as master bedroom. Good for a spare guest room or yoga/meditation space.',
    lord_tip: '12th lord in 12th own house or exalted → spiritual liberation and foreign gains. Afflicted → WNW needs Moon yantra and pearl grid.',
    professions: ['Yoga & Meditation', 'Hospitality', 'Foreign business', 'MNCs', 'Charitable work', 'Ashrams & hospitals'] },
]

/* Planet Character Profiles — Astro Vastu Spatial Mapping ─────────── */
const PLANET_PROFILES: Record<string, { vastuDir: string; element: string; color: string; core: string; health: string; strengths: string[]; weaknesses: string[]; spatial: string; remedy: string }> = {
  Su: { vastuDir: 'E / ENE', element: 'Fire (Agni)', color: '#f59e0b',
    core: 'Soul/Atma — willpower, authority, self-respect, innovation, truth, government',
    health: 'Heart, bones, right eye, spine',
    strengths: ['Leadership in east-facing careers', 'Strong personal identity', 'Government connections', 'Spiritual clarity'],
    weaknesses: ['Ego-driven decisions', 'Heart/bone vulnerabilities if afflicted', 'Conflict with authority figures'],
    spatial: 'Activate East zone for Sun-related life areas. Home office or study facing East amplifies solar energy. Red/orange accents in East wall.',
    remedy: 'Ruby (Manik), Copper Sun yantra in East, Surya Namaskar facing East at sunrise, Sunday fasting' },
  Mo: { vastuDir: 'NW', element: 'Water (Jal)', color: '#e2e8f0',
    core: 'Mind/Manas — emotions, mental stability, motherly nature, mood, intuition, hospitality',
    health: 'Left eye, mental disorders, depression, stomach, ovaries, breasts',
    strengths: ['Emotional intelligence', 'Strong intuition', 'Maternal nurturing energy', 'Hospitality business'],
    weaknesses: ['Mood swings', 'Excessive sentimentality', 'Sleep disorders if afflicted'],
    spatial: 'NW zone (Vayu-Moon) supports emotional comfort. Master bedroom should not be in NW (causes restlessness). Keep NW airy.',
    remedy: 'Pearl (Moti), Silver Moon yantra in NW, Monday puja with white flowers, Chandra mantra' },
  Ma: { vastuDir: 'S / SSE', element: 'Fire (Agni)', color: '#ef4444',
    core: 'Energy/Shakti — aggression, courage, fire, surgery, property, military, accidents',
    health: 'Blood, bones, injuries, hemoglobin, genitals, surgeries',
    strengths: ['Property acquisition', 'Physical courage', 'Engineering success', 'Sports achievement'],
    weaknesses: ['Aggressive conflict at home if in 4H', 'Accidents near South zone if afflicted', 'Impulsiveness'],
    spatial: 'South wall should be solid and load-bearing (Mars principle). No open spaces or cuts in South. Gym in S or SSE zone.',
    remedy: 'Red Coral (Moonga), Copper Mars yantra in SSE, Tuesday fast, Hanuman puja' },
  Me: { vastuDir: 'N / NNW', element: 'Air (Vayu)', color: '#22c55e',
    core: 'Intellect/Buddhi — intelligence, communication, business, networking, speech, Mercury rules trade',
    health: 'Nervous system, respiratory, spinal cord, depression, paralysis, deafness',
    strengths: ['Business acumen', 'Communication mastery', 'Financial intelligence', 'Technology aptitude'],
    weaknesses: ['Overthinking', 'Nervous system sensitivity', 'Indecisiveness if afflicted'],
    spatial: 'North zone (Mercury) governs opportunities and business. Home office or business cabin facing North or ENE maximises Mercury energy.',
    remedy: 'Emerald (Panna), Green Mercury yantra in N, Wednesday puja, Budha mantra chanting' },
  Ju: { vastuDir: 'NE / NNE', element: 'Water (Jal)', color: '#DAA520',
    core: 'Wisdom/Guru — expansion, growth, wisdom, prosperity, children, spirituality, divine grace',
    health: 'Liver, weight gain, cancer risk if afflicted, tumours, epilepsy',
    strengths: ['Divine wisdom', 'Teaching ability', 'Wealth expansion', 'Children\'s success'],
    weaknesses: ['Excessive optimism', 'Weight management challenges', 'Overindulgence if afflicted'],
    spatial: 'NE is Jupiter\'s supreme zone. Puja room must be here. Keep NE light, elevated and sacred. No heavy items or toilet in NE.',
    remedy: 'Yellow Sapphire (Pukhraj), Gold Jupiter yantra in NE, Thursday puja with yellow flowers, Brihaspati mantra' },
  Ve: { vastuDir: 'SE / ESE', element: 'Fire/Water', color: '#ec4899',
    core: 'Beauty/Shukra — love, marriage, wealth, vehicles, fashion, art, relationships, luxury',
    health: 'Throat, kidneys, tonsils, diabetes, skin problems',
    strengths: ['Creative arts mastery', 'Wealth accumulation', 'Relationship harmony', 'Luxury real estate'],
    weaknesses: ['Overindulgence', 'Kidney/diabetes risk if afflicted', 'Relationship complications'],
    spatial: 'SE zone (Venus-Agni) governs cash flow and confidence. Kitchen in SE is auspicious (Venus+Fire). Bedroom in SE for couples enhances romance.',
    remedy: 'Diamond (Heera) or White Sapphire, Silver Venus yantra in SE, Friday puja with white lotus, Shukra mantra' },
  Sa: { vastuDir: 'W / WSW', element: 'Air (Vayu)', color: '#94a3b8',
    core: 'Karma/Shani — discipline, delay, karma, responsibility, longevity, labourers, old age',
    health: 'Chronic illnesses, gallbladder, blockages, phobias, nervous conditions',
    strengths: ['Long-term discipline', 'Real estate gains', 'Research depth', 'Karmic leadership'],
    weaknesses: ['Delays and obstacles if weak', 'Chronic health issues', 'Depression tendencies'],
    spatial: 'West zone (Saturn) gives results of sustained effort. Heavy storage and utility rooms in West. No entrance in exact West (causes delays).',
    remedy: 'Blue Sapphire (Neelam) or Amethyst, Iron Saturn yantra in W, Saturday oil lamp at Shani temple, Shani mantra' },
  Ra: { vastuDir: 'SW', element: 'Earth (Prithvi)', color: '#7c3aed',
    core: 'Illusion/Maya — worldly desires, foreign elements, technology, ambition, secrecy, innovation',
    health: 'Multiplies diseases of associated planets, skin issues, neurological conditions',
    strengths: ['Technology success', 'Foreign connections', 'Material ambitions', 'Photography/Media'],
    weaknesses: ['Deception and illusion', 'Addictive tendencies', 'Instability if uncontrolled'],
    spatial: 'SW zone (Rahu-Earth) must be kept heavy and grounded. Main entrance never in SW. Master bedroom here for house owner is acceptable.',
    remedy: 'Hessonite Garnet (Gomed), Lead Rahu yantra in SW, Saturday or Rahu Kaal puja, Rahu mantra' },
  Ke: { vastuDir: 'NNE', element: 'Fire/Ether', color: '#a78bfa',
    core: 'Liberation/Moksha — detachment, spiritual liberation, research, past lives, isolation, healing',
    health: 'Mental health, isolation, mystical diseases, neurological conditions',
    strengths: ['Spiritual advancement', 'Research depth', 'Hidden knowledge', 'Traditional medicine'],
    weaknesses: ['Social detachment', 'Mental health sensitivity', 'Confusion about material goals'],
    spatial: 'NNE zone (Ketu) is sacred and mystical. Meditation room or underground safe in NNE. Keep spiritually clean — no waste or clutter.',
    remedy: 'Cat\'s Eye (Lahsuniya), Iron Ketu yantra in NNE, spiritual puja on Saturdays, Ketu mantra' },
}

/* 12-House Lord Placement Quick-Read Matrix ─────────────────────── */
const LORD_PLACEMENT_KEY = [
  { houses: [1, 5, 9], label: 'Trikona (Dharma Triangles)', quality: 'excellent', desc: 'Lord in these houses gives divine grace, purpose and natural luck. The corresponding Vastu zone flourishes without much effort.' },
  { houses: [4, 7, 10], label: 'Kendra (Pillar Houses)', quality: 'strong', desc: 'Lord in Kendra houses gives strong material results. The Vastu zone provides solid, stable support for the life area.' },
  { houses: [2, 11], label: 'Upachaya (Growth Houses)', quality: 'good', desc: 'Lord in 2nd or 11th gives increasing wealth and gains over time. The Vastu zone improves with age if kept clean.' },
  { houses: [3, 6], label: 'Dusthana (Challenge Houses)', quality: 'weak', desc: 'Lord in 3rd or 6th creates struggle and effort needed. The Vastu zone may leak energy — prioritise cleaning and activating.' },
  { houses: [8, 12], label: 'Dusthana (Loss/Hidden Houses)', quality: 'afflicted', desc: 'Lord in 8th or 12th hides or dissolves the life-area energy. The corresponding Vastu zone needs strong remediation and purification.' },
]

/* Rashi (Zodiac Sign) Quick Reference — Vedic Astro Vastu ─────────── */
const RASHI_PROFILES: Record<number, { symbol: string; element: string; lord: string; quality: string; vastuColor: string; advice: string }> = {
  1:  { symbol: '♈', element: 'Fire',  lord: 'Ma', quality: 'Energetic, pioneering, assertive, courageous', vastuColor: '#ef4444', advice: 'Red energisation in S/SSE zone activates your Lagna energy' },
  2:  { symbol: '♉', element: 'Earth', lord: 'Ve', quality: 'Reliable, patient, practical, affectionate', vastuColor: '#ec4899', advice: 'Venus remedies in SE zone enhance financial stability' },
  3:  { symbol: '♊', element: 'Air',   lord: 'Me', quality: 'Curious, adaptable, communicative, witty', vastuColor: '#22c55e', advice: 'Mercury activation in N zone boosts communication and business' },
  4:  { symbol: '♋', element: 'Water', lord: 'Mo', quality: 'Emotional, nurturing, intuitive, protective', vastuColor: '#e2e8f0', advice: 'Moon remedies in NW zone enhance domestic peace and intuition' },
  5:  { symbol: '♌', element: 'Fire',  lord: 'Su', quality: 'Confident, ambitious, generous, charismatic', vastuColor: '#f59e0b', advice: 'Sun activation in E/ENE zone amplifies authority and career' },
  6:  { symbol: '♍', element: 'Earth', lord: 'Me', quality: 'Analytical, meticulous, reliable, practical', vastuColor: '#22c55e', advice: 'Mercury in N zone + WSW zone for service-based income growth' },
  7:  { symbol: '♎', element: 'Air',   lord: 'Ve', quality: 'Diplomatic, charming, fair-minded, sociable', vastuColor: '#ec4899', advice: 'Venus activation in SE + N zone partnership harmony' },
  8:  { symbol: '♏', element: 'Water', lord: 'Ma', quality: 'Intense, resourceful, determined, passionate', vastuColor: '#ef4444', advice: 'Mars remedies in S + NNE zone for research and transformation' },
  9:  { symbol: '♐', element: 'Fire',  lord: 'Ju', quality: 'Optimistic, adventurous, independent, philosophical', vastuColor: '#DAA520', advice: 'Jupiter activation in NE zone maximises fortune and wisdom' },
  10: { symbol: '♑', element: 'Earth', lord: 'Sa', quality: 'Disciplined, responsible, ambitious, practical', vastuColor: '#94a3b8', advice: 'Saturn remedies in W/WSW zone for disciplined career growth' },
  11: { symbol: '♒', element: 'Air',   lord: 'Sa', quality: 'Innovative, humanitarian, independent, intellectual', vastuColor: '#94a3b8', advice: 'Saturn + Mercury combination activates gains in W and N zones' },
  12: { symbol: '♓', element: 'Water', lord: 'Ju', quality: 'Compassionate, artistic, intuitive, gentle', vastuColor: '#DAA520', advice: 'Jupiter remedies in NE + WNW zone for spiritual liberation and foreign gains' },
}

type TabId = 'chart' | 'compass' | 'mandala' | 'doshas' | 'rooms' | 'remedies' | 'bhavas'

function ScoreBar({ score, height = 8 }: { score: number; height?: number }) {
  const color = score > 70 ? 'var(--teal)' : score < 40 ? 'var(--rose)' : 'var(--gold)'
  return (
    <div style={{ height, background: 'var(--surface-3)', borderRadius: height, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${score}%`, background: `linear-gradient(90deg, ${color}, ${color}99)`, borderRadius: height, transition: 'width 1s cubic-bezier(0.22,1,0.36,1)', boxShadow: `0 0 6px ${color}44` }} />
    </div>
  )
}

function SectionTitle({ icon, title, subtitle, color = 'var(--text-gold)' }: { icon: string; title: string; subtitle?: string; color?: string }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', color, fontSize: '1.1rem', fontWeight: 600 }}>
        <span>{icon}</span>{title}
      </h3>
      {subtitle && <p style={{ margin: '0.3rem 0 0 1.7rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export function AstroVastuPanel({ chart }: AstroVastuPanelProps) {
  const { grahas } = chart
  const [mode, setMode]               = useState<'8' | '16'>('16')
  const [selectedZone, setSelectedZone]   = useState<string | null>(null)
  const [selectedDeity, setSelectedDeity] = useState<string | null>(null)
  const [activeTab, setActiveTab]     = useState<TabId>('compass')
  const [isMobile, setIsMobile]       = useState(false)
  const [isSmall,  setIsSmall]        = useState(false)

  React.useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768)
      setIsSmall(window.innerWidth < 480)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const activeZones = mode === '16' ? ZONES_16 : ZONES_8
  const sectorAngle = mode === '16' ? 22.5 : 45

  /* Zone analysis with scoring ────────────────────────────────── */
  const analysis = useMemo(() => {
    return activeZones.map(zone => {
      const occupants = grahas.filter(g => {
        const signAngle = (g.rashi - 1) * 30 + 15
        const diff = Math.abs(signAngle - zone.angle)
        const threshold = mode === '16' ? 15 : 25
        return diff < threshold || Math.abs(signAngle - zone.angle - 360) < threshold
      })
      const rulingPlanet = grahas.find(g => g.id === zone.ruling)
      let score = 50
      if (rulingPlanet) {
        if (rulingPlanet.dignity === 'exalted')     score += 30
        if (rulingPlanet.dignity === 'own')          score += 20
        if (rulingPlanet.dignity === 'moolatrikona') score += 25
        if (rulingPlanet.dignity === 'debilitated')  score -= 30
        if (rulingPlanet.isRetro)                    score -= 10
      }
      const malefics = occupants.filter(g => ['Sa', 'Ra', 'Ke', 'Ma'].includes(g.id))
      if (['N', 'NE', 'E'].includes(zone.id) && malefics.length > 0) score -= 15
      return { ...zone, occupants, rulingPlanet, score: Math.max(0, Math.min(100, score)) }
    })
  }, [grahas, activeZones, mode])

  const overallScore  = Math.round(analysis.reduce((a, z) => a + z.score, 0) / analysis.length)
  const bestZone      = [...analysis].sort((a, b) => b.score - a.score)[0]
  const worstZone     = [...analysis].sort((a, b) => a.score - b.score)[0]
  const grade         = overallScore > 78 ? 'A+' : overallScore > 68 ? 'A' : overallScore > 58 ? 'B+' : overallScore > 48 ? 'B' : overallScore > 38 ? 'C' : 'D'
  const gradeColor    = overallScore > 68 ? 'var(--teal)' : overallScore > 50 ? 'var(--gold)' : 'var(--rose)'

  const bestEntrance = useMemo(() => {
    const top = [...analysis].filter(z => ['N','E','W','S'].includes(z.id)).sort((a, b) => b.score - a.score)
    return top[0] || analysis[0]
  }, [analysis])

  const dominantElement = useMemo(() => {
    const counts: Record<string, number> = {}
    analysis.forEach(z => { counts[z.element] = (counts[z.element] || 0) + z.score })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  }, [analysis])

  /* Positioned planets ────────────────────────────────────────── */
  const positionedPlanets = useMemo(() => {
    const pos = grahas.map(p => ({ ...p, angle: ((p.rashi - 1) * 30 + p.degree) - 90, r: 100 }))
    pos.sort((a, b) => a.angle - b.angle)
    for (let i = 0; i < pos.length; i++) {
      let stack = 0
      for (let j = 0; j < i; j++) {
        const d = Math.abs(pos[i].angle - pos[j].angle)
        if (d < 8 || d > 352) stack++
      }
      pos[i].r += stack * 22
    }
    return pos
  }, [grahas])

  /* Navagraha planet dignity map ──────────────────────────────── */
  const grahaMap = useMemo(() => {
    const m: Record<string, typeof grahas[number]> = {}
    grahas.forEach(g => { m[g.id] = g })
    return m
  }, [grahas])

  /* Bhava data — house rashi, occupants, lord placement ───────── */
  const bhavaData = useMemo(() => {
    const asc = ((chart.lagnas?.ascRashi ?? 1) as number)
    return BHAVA_MAP.map((bh, i) => {
      const houseRashi = ((asc - 1 + i) % 12) + 1
      const rashiProfile = RASHI_PROFILES[houseRashi]
      const lordId = rashiProfile?.lord ?? ''
      const lordGraha = grahas.find(g => g.id === lordId)
      const lordRashi = lordGraha?.rashi ?? houseRashi
      const lordHouse = ((lordRashi - asc + 12) % 12) + 1
      const qualityEntry = LORD_PLACEMENT_KEY.find(lpk => lpk.houses.includes(lordHouse))
      const occupants = grahas.filter(g => g.rashi === houseRashi)

      // Generate dynamic Vastu insight based on chart
      let dynamicTip = bh.activate.split('.')[0] + '.'
      if (lordGraha) {
        const lordName = GRAHA_NAMES[lordId as GrahaId] ?? lordId
        if (qualityEntry?.quality === 'excellent' || qualityEntry?.quality === 'strong' || qualityEntry?.quality === 'good') {
          dynamicTip = `H${bh.h} lord ${lordName} is strong in H${lordHouse}. The ${bh.dir} zone naturally energises; keep it clean and unobstructed.`
        } else if (qualityEntry?.quality === 'weak' || qualityEntry?.quality === 'afflicted' || qualityEntry?.quality === 'challenging') {
          dynamicTip = `H${bh.h} lord ${lordName} is weak in H${lordHouse}. Prioritise Vastu remedies in the ${bh.dir} zone to support this area.`
        } else {
          dynamicTip = `H${bh.h} lord ${lordName} is neutral in H${lordHouse}. Maintain balance in the ${bh.dir} zone.`
        }
      }

      if (occupants.length > 0) {
        const occNames = occupants.map(o => GRAHA_NAMES[o.id as GrahaId] ?? o.id).join(', ')
        dynamicTip += ` Occupants: ${occNames} project their energy here.`
      }

      return { ...bh, houseRashi, rashiProfile, lordId, lordGraha, lordHouse, qualityEntry, occupants, dynamicTip }
    })
  }, [grahas, chart.lagnas?.ascRashi])

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'chart',    label: 'Lagna Chart',        icon: '🔵' },
    { id: 'compass',  label: 'Compass',            icon: '🧭' },
    { id: 'bhavas',   label: 'Bhava Vastu',         icon: '📖' },
    { id: 'mandala',  label: 'Mandala',             icon: '💠' },
    { id: 'doshas',   label: 'Doshas',              icon: '🔮' },
    { id: 'rooms',    label: 'Rooms & Design',      icon: '🏠' },
    { id: 'remedies', label: 'Remedies & Yantras',  icon: '⚡' },
  ]

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: 'var(--text-primary)' }}>

      {/* ── HERO HEADER ────────────────────────────────────────── */}
      <section className="vastu-hero-header">
        <div className="vastu-glow-top-right" /><div className="vastu-glow-bottom-left" />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ flex: '1 1 280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <div className="vastu-icon-ring">☸</div>
              <div>
                <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-gold)', fontWeight: 700, marginBottom: '0.15rem' }}>
                  Mahāvāstu · Jyotiṣa Vidyā
                </div>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 300, fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
                  Advanced Astro-Vāstu
                </h1>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '580px', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              Precision synthesis of <em>Manasara, Mayamata, Brihat Samhita</em> and Mahavastu — mapping 16 directional zones, 45 Vastu Devatas, Navagraha zones, Prana Vayu, and Pancha Bhuta balance to your natal chart.
            </p>
            <div style={{ display: 'flex', background: 'var(--surface-3)', padding: '3px', borderRadius: '10px', width: 'fit-content', border: '1px solid var(--border-soft)', gap: '2px' }}>
              {(['8', '16'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setSelectedZone(null) }} style={{ padding: '0.42rem 1rem', borderRadius: '7px', border: 'none', background: mode === m ? 'var(--gold)' : 'transparent', color: mode === m ? 'var(--text-on-gold)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.25s', fontWeight: 600, fontSize: '0.78rem', boxShadow: mode === m ? '0 2px 10px rgba(201,168,76,0.35)' : 'none', fontFamily: 'inherit' }}>
                  {m}-Kona
                </button>
              ))}
            </div>
          </div>

          <div className="vastu-grade-card" style={{ borderColor: gradeColor, boxShadow: `0 0 28px ${overallScore > 68 ? 'rgba(78,205,196,0.12)' : overallScore > 50 ? 'rgba(201,168,76,0.12)' : 'rgba(224,123,142,0.12)'}` }}>
            <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Spatial Harmony</div>
            <div style={{ fontSize: '2.8rem', fontWeight: 800, color: gradeColor, lineHeight: 1 }}>{grade}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{overallScore}% Score</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ position: 'relative', marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
          {[
            { label: 'Power Zone',    value: bestZone.id,     sub: `${bestZone.score}% strength`,      color: 'var(--teal)' },
            { label: 'Weak Zone',     value: worstZone.id,    sub: `${worstZone.score}% strength`,     color: 'var(--rose)' },
            { label: 'Best Entrance', value: bestEntrance.id, sub: bestEntrance.quality.split(',')[0], color: 'var(--gold)' },
            { label: 'Lead Element',  value: ELEM_ICON[dominantElement] + ' ' + dominantElement, sub: 'Dominant Bhuta', color: 'var(--accent)' },
          ].map(s => (
            <div key={s.label} className="vastu-stat-chip" style={{ borderLeftColor: s.color }}>
              <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{s.label}</div>
              <div style={{ fontWeight: 700, color: s.color, fontSize: '0.95rem', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TAB NAVIGATION ─────────────────────────────────────── */}
      <nav style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`vastu-tab-btn${activeTab === tab.id ? ' vastu-tab-active' : ''}`}>
            <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
            {!isMobile && <span>{tab.label}</span>}
          </button>
        ))}
      </nav>

      {/* ══════════════════════════════════════════════════════════
          TAB: LAGNA CHART
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'chart' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <SectionTitle icon="🔵" title="Lagna Kundali" subtitle="Natal birth chart — use alongside the directional analysis for a complete Astro-Vāstu reading" />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ChakraSelector
              ascRashi={chart.lagnas.ascRashi}
              grahas={chart.grahas}
              lagnas={chart.lagnas}
              arudhas={chart.arudhas}
              moonNakIndex={chart.panchang?.nakshatra?.index ?? 0}
              tithiNumber={chart.panchang?.tithi?.number ?? 1}
              varaNumber={chart.panchang?.vara?.number ?? 0}
              defaultStyle="north"
              size={480}
            />
          </div>

          {/* Planet summary strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '0.6rem',
          }}>
            {chart.grahas
              .filter((g: { id: string }) => !['Ur', 'Ne', 'Pl'].includes(g.id))
              .map((g: { id: string; rashi: number; degree: number; dignity?: string; isRetro?: boolean }) => {
                const dignityColor =
                  g.dignity === 'exalted'      ? 'var(--teal)'  :
                  g.dignity === 'own'           ? 'var(--gold)'  :
                  g.dignity === 'moolatrikona'  ? 'var(--accent)':
                  g.dignity === 'debilitated'   ? 'var(--rose)'  : 'var(--text-secondary)'
                return (
                  <div key={g.id} style={{
                    padding: '0.5rem 0.75rem',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.15rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: dignityColor, fontFamily: 'var(--font-chart-planets)' }}>
                        {g.id}{g.isRetro ? 'ᴿ' : ''}
                      </span>
                      {g.dignity && (
                        <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: dignityColor, opacity: 0.85 }}>
                          {g.dignity === 'moolatrikona' ? 'MuT' : g.dignity.slice(0, 3)}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {RASHI_NAMES[g.rashi as Rashi] ?? g.rashi}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                      {g.degree.toFixed(1)}°
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: COMPASS
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'compass' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '2rem', alignItems: 'flex-start' }}>
          {/* SVG Compass */}
          <div style={{ flex: '0 0 auto', width: '100%', maxWidth: isMobile ? '100%' : '420px' }}>
            <div className="vastu-compass-container" style={{ position: 'relative', width: '100%', maxWidth: '420px', aspectRatio: '1', margin: '0 auto' }}>
              <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <defs>
                  <radialGradient id="brahmaGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stopColor="rgba(201,168,76,0.45)" />
                    <stop offset="100%" stopColor="rgba(201,168,76,0)" />
                  </radialGradient>
                  <filter id="segGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                {/* Outer rings */}
                <circle cx="100" cy="100" r="97" fill="none" stroke="var(--border)" strokeWidth="0.4" strokeDasharray="2 3" />
                <circle cx="100" cy="100" r="90" fill="none" stroke="var(--border-soft)" strokeWidth="0.3" />

                {/* Segments */}
                {analysis.map((zone, i) => {
                  const sa = (i * sectorAngle) * Math.PI / 180, ea = ((i+1) * sectorAngle) * Math.PI / 180
                  const x1 = 100+89*Math.cos(sa), y1 = 100+89*Math.sin(sa), x2 = 100+89*Math.cos(ea), y2 = 100+89*Math.sin(ea)
                  const col = zone.score > 70 ? '#4ecdc4' : zone.score < 40 ? '#e07b8e' : '#c9a84c'
                  const active = selectedZone === zone.id
                  return (
                    <path key={zone.id} onClick={() => setSelectedZone(active ? null : zone.id)} className="zone-segment"
                      d={`M 100 100 L ${x1} ${y1} A 89 89 0 0 1 ${x2} ${y2} Z`}
                      fill={col} stroke={active ? col : 'var(--border)'} strokeWidth={active ? 1.2 : 0.4}
                      style={{ cursor: 'pointer', transition: 'all 0.3s', opacity: active ? 0.58 : zone.score > 70 ? 0.2 : zone.score < 40 ? 0.14 : 0.11, filter: active ? 'url(#segGlow)' : 'none' }}
                    />
                  )
                })}

                {/* Labels */}
                {analysis.map((zone, i) => {
                  const angle = (i * sectorAngle + sectorAngle/2) * Math.PI/180
                  const tx = 100+70*Math.cos(angle), ty = 100+70*Math.sin(angle)
                  const active = selectedZone === zone.id
                  const col = zone.score > 70 ? '#4ecdc4' : zone.score < 40 ? '#e07b8e' : '#c9a84c'
                  return <text key={'lbl-'+zone.id} x={tx} y={ty} textAnchor="middle" fill={active ? col : 'var(--text-muted)'} fontSize={mode==='16'?3.8:5.5} fontWeight={active?800:500} transform={`rotate(90 ${tx} ${ty})`} style={{ transition: 'all 0.3s', pointerEvents: 'none' }}>{zone.id}</text>
                })}

                {/* Score dots */}
                {analysis.map((zone, i) => {
                  const angle = (i * sectorAngle + sectorAngle/2) * Math.PI/180
                  const tx = 100+93*Math.cos(angle), ty = 100+93*Math.sin(angle)
                  const col = zone.score > 70 ? '#4ecdc4' : zone.score < 40 ? '#e07b8e' : '#c9a84c'
                  return <circle key={'dot-'+zone.id} cx={tx} cy={ty} r="1.8" fill={col} opacity="0.75" />
                })}

                {/* Brahma Sthana center */}
                <circle cx="100" cy="100" r="20" fill="url(#brahmaGrad)" />
                <circle cx="100" cy="100" r="20" fill="var(--surface-1)" stroke="var(--gold)" strokeWidth="1.2" />
                <text x="100" y="97"  textAnchor="middle" fill="var(--text-gold)" fontSize="4.5" fontWeight="800" transform="rotate(90 100 100)">BRAHM</text>
                <text x="100" y="106" textAnchor="middle" fill="var(--text-muted)" fontSize="3.2"              transform="rotate(90 100 100)">STHĀN</text>
              </svg>

              {/* Planet overlays */}
              {positionedPlanets.map(p => (
                <div key={p.id} title={`${GRAHA_NAMES[p.id as GrahaId]} · ${Math.floor(p.degree)}° ${RASHI_NAMES[p.rashi]}${p.isRetro?' (Retro)':''}`}
                  style={{ position: 'absolute', top: '50%', left: '50%', transform: `rotate(${p.angle}deg) translateX(${isMobile?p.r*0.78:p.r}px)`, background: p.isRetro ? 'rgba(224,123,142,0.18)' : 'var(--surface-4)', backdropFilter: 'blur(4px)', borderRadius: '50%', width: isMobile?'22px':'28px', height: isMobile?'22px':'28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile?'0.55rem':'0.65rem', fontWeight: 800, border: `2px solid ${p.isRetro?'var(--rose)':'var(--gold)'}`, boxShadow: `0 2px 10px rgba(0,0,0,0.5), 0 0 8px ${p.isRetro?'rgba(224,123,142,0.4)':'rgba(201,168,76,0.3)'}`, zIndex: 10, cursor: 'help', transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)' }}>
                  <span style={{ transform: `rotate(${-p.angle}deg)`, color: p.isRetro?'var(--rose)':'var(--text-gold)' }}>{p.id}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedZone ? (() => {
              const z = analysis.find(z => z.id === selectedZone)!
              const sc = z.score > 70 ? 'var(--teal)' : z.score < 40 ? 'var(--rose)' : 'var(--gold)'
              const ng = NAVAGRAHA_ZONES.find(n => n.dir === z.id || n.dir === z.id)
              return (
                <div className="card" style={{ padding: '1.75rem', border: `1px solid ${sc}`, boxShadow: `0 8px 40px rgba(0,0,0,0.3), 0 0 25px ${sc}18` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Zone Analysis</div>
                      <h2 style={{ margin: 0, color: sc, fontSize: '1.6rem', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>{z.name}</h2>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                        {ELEM_ICON[z.element]} {z.element} (Pancha Bhuta) · Prana: {z.prana} Vāyu
                      </div>
                    </div>
                    <button onClick={() => setSelectedZone(null)} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem 0.7rem', fontSize: '0.8rem', fontFamily: 'inherit' }}>✕</button>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Energy Score</span>
                      <span style={{ color: sc, fontWeight: 700 }}>{z.score}% — {z.score > 70 ? 'Highly Auspicious' : z.score < 40 ? 'Afflicted — Remedy Required' : 'Moderate'}</span>
                    </div>
                    <ScoreBar score={z.score} height={10} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {[
                      { l: 'Quality',      v: z.quality },
                      { l: 'Prana Vayu',   v: z.prana + ' Vāyu' },
                      { l: 'Element',      v: `${ELEM_ICON[z.element]} ${z.element}` },
                      { l: 'Deity Lord',   v: GRAHA_NAMES[z.ruling as GrahaId] },
                    ].map(item => (
                      <div key={item.l} style={{ padding: '0.7rem', background: 'var(--surface-3)', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{item.l}</div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{item.v}</div>
                      </div>
                    ))}
                  </div>

                  {ng && (
                    <div style={{ marginBottom: '1rem', padding: '0.85rem', background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--border-soft)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.4rem' }}>🪐</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>{ng.name} — Navagraha Lord</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ng.qual}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-gold)', marginTop: '0.3rem', fontStyle: 'italic' }}>Mantra: {ng.mantra}</div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Occupants</div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {z.occupants.length > 0 ? z.occupants.map(o => <span key={o.id} className="badge badge-accent">{o.id}{o.isRetro?' ℞':''}</span>) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No planets in this zone</span>}
                      </div>
                    </div>
                    <div style={{ padding: '0.9rem', borderRadius: '10px', borderLeft: `4px solid ${z.score < 50 ? 'var(--rose)' : 'var(--teal)'}`, background: z.score < 50 ? 'rgba(224,123,142,0.05)' : 'rgba(78,205,196,0.05)', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                      <strong style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.68rem', textTransform: 'uppercase', color: z.score < 50 ? 'var(--rose)' : 'var(--teal)' }}>{z.score < 50 ? '⚠ Remedy Required' : '✓ Auspicious Zone — Leverage It'}</strong>
                      {z.score < 50 ? `Balance ${z.element} energy in the ${z.name}. Perform ${GRAHA_NAMES[z.ruling as GrahaId]} Graha Shanti. Place ${ELEM_ICON[z.element]} elemental markers. Remove heavy obstructions or sharp corners pointed at this zone.` : `Activate this zone for ${z.quality.toLowerCase()}. Strengthen it with ${ELEM_ICON[z.element]} ${z.element} element markers. This is your primary power corridor.`}
                    </div>
                  </div>
                </div>
              )
            })() : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: '0.45rem', maxHeight: isMobile ? 'none' : '440px', overflowY: 'auto' }}>
                  {analysis.map(zone => {
                    const sc = zone.score > 70 ? 'var(--teal)' : zone.score < 40 ? 'var(--rose)' : 'var(--gold)'
                    return (
                      <button key={zone.id} onClick={() => setSelectedZone(zone.id)} className="vastu-zone-card" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 0.85rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: sc, flexShrink: 0, boxShadow: `0 0 6px ${sc}` }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.83rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.4rem' }}>{zone.id}</span>
                            <span style={{ color: sc, flexShrink: 0 }}>{zone.score}%</span>
                          </div>
                          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>{zone.quality.split(',')[0]}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Click a segment on the compass or a zone to view analysis</p>
              </>
            )}

            {/* Axis Conflict (Veedhi Shoola) */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--rose)' }}>
              <h4 style={{ margin: '0 0 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--rose)', fontSize: '0.9rem' }}>⚔ Veedhi Shoola — Axis Tension Analysis</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[['N','S'],['E','W'],['NE','SW'],['SE','NW']].map(([a, b]) => {
                  const za = analysis.find(z => z.id === a), zb = analysis.find(z => z.id === b)
                  if (!za || !zb) return null
                  const conflict = (za.score > 70 && zb.score < 30) || (za.score < 30 && zb.score > 70)
                  return (
                    <div key={a+b} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: conflict ? 'rgba(224,123,142,0.07)' : 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border-soft)' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>{a} ⟷ {b}</span>
                      <span style={{ fontSize: '0.72rem', color: conflict ? 'var(--rose)' : 'var(--teal)', fontWeight: 600 }}>{conflict ? '⚡ Tension — elemental realignment needed' : '✓ Balanced axis'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: MANDALA
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'mandala' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '2rem', alignItems: 'flex-start' }}>
          <div style={{ flex: '0 0 auto', width: '100%', maxWidth: isMobile ? '100%' : '520px', margin: '0 auto' }}>
            <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-gold)', fontSize: '1.05rem' }}>💠 Vastu Purusha Mandala</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ekashitipada (81-pada) — 45 Devatas · Click cell for deity details & mantra</p>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.68rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, background: 'var(--teal)', borderRadius: 2, display: 'inline-block' }} /> Blessed</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, background: 'var(--rose)', borderRadius: 2, display: 'inline-block' }} /> Afflicted</span>
              </div>
            </div>
            <svg viewBox="0 0 90 90" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 6px 25px rgba(0,0,0,0.35))' }}>
              <defs><pattern id="vGrid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--border-soft)" strokeWidth="0.12"/></pattern></defs>
              <rect width="90" height="90" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="0.5" rx="1"/>
              <rect width="90" height="90" fill="url(#vGrid)"/>
              {DEITY_MAP.map(d => {
                const hits = grahas.filter(p => {
                  if (d.center) return false
                  const angle = ((p.rashi-1)*30 + p.degree) % 360
                  return d.ang[0] > d.ang[1] ? angle >= d.ang[0] || angle < d.ang[1] : angle >= d.ang[0] && angle < d.ang[1]
                })
                const malHit = hits.some(h => ['Sa','Ra','Ke','Ma'].includes(h.id))
                const benHit = hits.some(h => ['Ju','Ve','Mo','Me'].includes(h.id))
                const active = selectedDeity === d.id
                const fill = d.center ? 'rgba(201,168,76,0.28)' : malHit ? 'var(--rose)' : benHit ? 'var(--teal)' : 'transparent'
                return (
                  <g key={d.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedDeity(d.id)}>
                    <rect x={d.x*10} y={d.y*10} width={d.w*10} height={d.h*10} fill={fill} fillOpacity={active?0.42:d.center?0.28:fill==='transparent'?0:0.2} stroke={active||d.center?'var(--gold)':'var(--border-soft)'} strokeWidth={active||d.center?0.9:0.2} style={{ transition: 'all 0.2s' }}/>
                    {d.w >= 1 && d.h >= 1 && <text x={d.x*10+d.w*5} y={d.y*10+d.h*5} fontSize={d.center?4.5:2.1} textAnchor="middle" dominantBaseline="middle" fill={active?'var(--text-gold)':d.center?'var(--text-gold)':'var(--text-muted)'} fontWeight={d.center?800:active||malHit||benHit?700:400} style={{ pointerEvents: 'none', transition: 'all 0.2s' }}>{d.name.substring(0,10)}</text>}
                    {hits.length > 0 && <circle cx={d.x*10+d.w*10-2} cy={d.y*10+2} r="1.3" fill={malHit?'var(--rose)':'var(--teal)'}/>}
                  </g>
                )
              })}
            </svg>

            {/* 32 Dwara legend */}
            <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {[{q:'best',c:'var(--teal)',l:'Śubha (Auspicious)'},{q:'good',c:'var(--gold)',l:'Madhyama (Good)'},{q:'average',c:'var(--text-muted)',l:'Sāmānya (Average)'},{q:'bad',c:'var(--rose)',l:'Aśubha (Avoid)'}].map(x => (
                <span key={x.q} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: x.c, display: 'inline-block' }} />{x.l}
                </span>
              ))}
            </div>
          </div>

          {/* Deity detail */}
          <div className="card" style={{ flex: 1, padding: '1.75rem', background: 'var(--surface-2)', minHeight: isMobile ? 'auto' : '400px', width: '100%' }}>
            {selectedDeity ? (() => {
              const deityData = DEITY_MAP.find(dm => dm.id === selectedDeity)
              const info = DEITY_DESC[selectedDeity]
              const displayName = selectedDeity.charAt(0).toUpperCase() + selectedDeity.slice(1).replace(/_/g,' ')
              const hits = deityData ? grahas.filter(p => {
                if (deityData.center) return false
                const angle = ((p.rashi-1)*30+p.degree)%360
                return deityData.ang[0] > deityData.ang[1] ? angle >= deityData.ang[0] || angle < deityData.ang[1] : angle >= deityData.ang[0] && angle < deityData.ang[1]
              }) : []
              const maleficHits = hits.filter(h => ['Sa','Ra','Ke','Ma'].includes(h.id))
              const beneficHits = hits.filter(h => ['Ju','Ve','Mo','Me'].includes(h.id))
              const dwaraQ = (deityData as typeof DEITY_MAP[0] & { dwaraQ?: string })?.dwaraQ
              const dwaraColor = dwaraQ==='best' ? 'var(--teal)' : dwaraQ==='good' ? 'var(--gold)' : dwaraQ==='bad' ? 'var(--rose)' : 'var(--text-muted)'
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ padding: '3px 10px', background: 'var(--gold-faint)', color: 'var(--text-gold)', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', border: '1px solid var(--border-bright)' }}>Devatā Detail</span>
                      {dwaraQ && <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700, border: `1px solid ${dwaraColor}`, color: dwaraColor }}>32 Dwara: {dwaraQ === 'best' ? 'Śubha' : dwaraQ === 'good' ? 'Madhyama' : dwaraQ === 'bad' ? 'Aśubha' : 'Sāmānya'}</span>}
                    </div>
                    <button onClick={() => setSelectedDeity(null)} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem 0.65rem', fontSize: '0.8rem', fontFamily: 'inherit' }}>✕</button>
                  </div>

                  <div>
                    <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.75rem', lineHeight: 1.1, fontWeight: 400 }}>{displayName}</h2>
                    {info && <div style={{ fontSize: '0.72rem', color: 'var(--text-gold)', marginTop: '0.3rem' }}>{info.quality}</div>}
                    <p style={{ marginTop: '0.65rem', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                      {info?.desc || 'A vital energy field in the Vāstu Maṇḍala representing specific cosmic attributes.'}
                    </p>
                  </div>

                  {info?.mantra && (
                    <div style={{ padding: '0.85rem', background: 'var(--gold-faint)', borderRadius: '10px', border: '1px solid var(--border-bright)' }}>
                      <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Bīja Mantra for Activation</div>
                      <div style={{ fontFamily: 'var(--font-display)', color: 'var(--text-gold)', fontSize: '0.9rem' }}>{info.mantra}</div>
                    </div>
                  )}

                  <div className="divider" />

                  <div>
                    <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Planetary Hit Analysis</div>
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                      {maleficHits.map(h => <span key={h.id} style={{ padding: '0.32rem 0.7rem', background: 'rgba(224,123,142,0.1)', color: 'var(--rose)', border: '1px solid var(--rose)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>⚠ Afflicted: {h.name}</span>)}
                      {beneficHits.map(h => <span key={h.id} style={{ padding: '0.32rem 0.7rem', background: 'rgba(78,205,196,0.1)', color: 'var(--teal)', border: '1px solid var(--teal)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>✓ Blessed: {h.name}</span>)}
                      {hits.length === 0 && <span style={{ padding: '0.32rem 0.7rem', background: 'rgba(78,205,196,0.08)', color: 'var(--teal)', border: '1px solid var(--teal)', borderRadius: '6px', fontSize: '0.78rem' }}>✓ No Malefic Affliction</span>}
                    </div>
                  </div>
                </div>
              )
            })() : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', opacity: 0.5, minHeight: '320px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>💠</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, margin: '0 0 0.4rem' }}>Select a Deity</h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '220px', lineHeight: 1.5 }}>Click any cell to explore its deity, mantra, qualities, and planetary influence</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: DOSHAS
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'doshas' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* Dosha Overview Cards */}
          <div>
            <SectionTitle icon="🔮" title="Vastu Dosha Analysis" subtitle="From Manasara, Mayamata, Vishwakarma Prakash & classical Vastu Shastra" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {VASTU_DOSHAS.map((d, i) => {
                const sevColor = d.severity === 'critical' ? 'var(--rose)' : d.severity === 'high' ? '#f97316' : d.severity === 'medium' ? 'var(--gold)' : 'var(--text-muted)'
                return (
                  <details key={d.id} className="vastu-dosha-card" style={{ borderLeft: `5px solid ${sevColor}` }}>
                    <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '1.1rem 1.25rem', gap: '1rem', flexWrap: 'wrap', userSelect: 'none', listStyle: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.62rem', padding: '3px 8px', background: `${sevColor}22`, color: sevColor, borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', border: `1px solid ${sevColor}44`, flexShrink: 0 }}>
                          {d.severity}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{d.name}</div>
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Zone: {d.zone}</div>
                        </div>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>▼</span>
                    </summary>
                    <div style={{ padding: '0 1.25rem 1.25rem' }}>
                      <p style={{ margin: '0 0 0.9rem', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{d.desc}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.9rem' }}>
                        <div style={{ padding: '0.8rem', background: 'rgba(224,123,142,0.06)', borderRadius: '8px', border: '1px solid rgba(224,123,142,0.18)' }}>
                          <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: '0.35rem', fontWeight: 700 }}>⚡ Effect</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{d.effect}</div>
                        </div>
                        <div style={{ padding: '0.8rem', background: 'rgba(78,205,196,0.06)', borderRadius: '8px', border: '1px solid rgba(78,205,196,0.18)' }}>
                          <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: '0.35rem', fontWeight: 700 }}>✦ Remedy</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{d.remedy}</div>
                        </div>
                      </div>
                      <div style={{ padding: '0.65rem 0.9rem', background: 'var(--gold-faint)', borderRadius: '8px', border: '1px solid var(--border-bright)', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                        📜 {d.scripture}
                      </div>
                    </div>
                  </details>
                )
              })}
            </div>
          </div>

          {/* Navagraha Zone Map */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <SectionTitle icon="🪐" title="Navagraha Directional Zones" subtitle="Nine planetary zones — Vedic Vastu Navagraha placement from Brihat Samhita" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {NAVAGRAHA_ZONES.map(ng => {
                const g = grahaMap[ng.planet]
                const digScore = g?.dignity === 'exalted' ? 100 : g?.dignity === 'own' ? 80 : g?.dignity === 'moolatrikona' ? 85 : g?.dignity === 'debilitated' ? 15 : 50
                const sc = digScore > 70 ? 'var(--teal)' : digScore < 35 ? 'var(--rose)' : 'var(--gold)'
                return (
                  <div key={ng.planet} style={{ padding: '0.9rem 1rem', background: 'var(--surface-2)', borderRadius: '12px', border: `1px solid ${ng.color}33`, borderLeft: `4px solid ${ng.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: ng.color }}>{ng.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Direction: {ng.en} ({ng.dir})</div>
                      </div>
                      <span className="badge badge-accent" style={{ flexShrink: 0 }}>{ng.planet}</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', lineHeight: 1.4 }}>{ng.qual}</div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Planetary Strength</span>
                        <span style={{ color: sc, fontWeight: 700 }}>{g?.dignity || 'Neutral'}</span>
                      </div>
                      <ScoreBar score={digScore} height={5} />
                    </div>
                    <div style={{ padding: '0.5rem', background: 'var(--gold-faint)', borderRadius: '6px', fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>🔧 {ng.remedy}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Panchabhutas Analysis */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <SectionTitle icon="🌐" title="Pancha Bhūta — Five Element Balance" subtitle="The five cosmic elements and their directional zones from Vedic cosmology" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              {PANCHA_BHUTAS.map(b => {
                const zoneScores = analysis.filter(z => b.zones.some(bz => z.id === bz || z.id.startsWith(bz)))
                const avgScore = zoneScores.length > 0 ? Math.round(zoneScores.reduce((a, z) => a + z.score, 0) / zoneScores.length) : 50
                const sc = avgScore > 70 ? 'var(--teal)' : avgScore < 40 ? 'var(--rose)' : 'var(--gold)'
                return (
                  <div key={b.bhuta} style={{ padding: '1rem', background: 'var(--surface-2)', borderRadius: '12px', border: `1px solid ${b.color}44`, borderTop: `3px solid ${b.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{b.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: b.color, fontSize: '0.9rem' }}>{b.name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{b.bhuta}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 700, color: sc }}>{avgScore}%</div>
                    </div>
                    <ScoreBar score={avgScore} height={6} />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.6rem', lineHeight: 1.4 }}>{b.qual}</div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.67rem', color: b.color }}>{b.zones.join(', ')}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Prana Vayu Map */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <SectionTitle icon="🌬️" title="Prana Vayu — Five Life Force Currents" subtitle="The five vital energy flows (Pancha Prana) mapped to directional zones" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {PRANA_VAYU_MAP.map(pv => (
                <div key={pv.vayu} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '0.9rem 1rem', background: 'var(--surface-2)', borderRadius: '10px', border: `1px solid ${pv.color}33`, borderLeft: `4px solid ${pv.color}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: pv.color }}>{pv.vayu}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-gold)' }}>{pv.dir}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{pv.func}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Marma Points */}
          <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--rose)' }}>
            <SectionTitle icon="⚠️" title="16 Marma Points — Sacred Energy Meridians" subtitle="From Vastu Shastra: these 16 points must NEVER be drilled, bored, or pierced" color="var(--rose)" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.55rem' }}>
              {MARMA_POINTS.map(m => (
                <div key={m.id} style={{ padding: '0.7rem 0.9rem', background: 'rgba(224,123,142,0.05)', borderRadius: '8px', border: '1px solid rgba(224,123,142,0.18)', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--rose)', fontWeight: 800, flexShrink: 0, fontSize: '0.8rem' }}>⚡</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.15rem' }}>{m.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{m.pos}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: ROOMS & DESIGN
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'rooms' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* Personalized Facing + Dig Bala */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--accent)', background: 'linear-gradient(135deg, var(--surface-2), var(--surface-3))' }}>
              <SectionTitle icon="🧭" title="Personalized House Facing" subtitle="Based on Lagna Rashi — Vedic directional alignment" color="var(--accent)" />
              {(() => {
                const lagnaRashi = chart.lagnas.ascRashi
                const facing = lagnaRashi % 4 === 1 ? 'East' : lagnaRashi % 4 === 2 ? 'South' : lagnaRashi % 4 === 3 ? 'West' : 'North'
                const faceDir = { East: { why: 'Solar energy amplifies your ascendant, bringing vitality, social recognition, and leadership.', mantra: 'Surya-facing home aligned with solar Lagna' }, South: { why: 'Mars energy grounds your ascendant, providing strength, stability, and material accumulation.', mantra: 'Yama-facing home — fame and authority' }, West: { why: 'Saturn energy disciplines your ascendant, supporting longevity, gains, and structured growth.', mantra: 'Varuna-facing home — profits and results' }, North: { why: 'Mercury energy activates your ascendant, supporting business, communication, and opportunities.', mantra: 'Kubera-facing home — wealth and opportunity' } }
                const faceInfo = faceDir[facing as keyof typeof faceDir]
                return (
                  <>
                    <div style={{ padding: '1.1rem', background: 'var(--surface-1)', borderRadius: '12px', border: '1px solid var(--accent-glow)', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Optimal Orientation</div>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>{facing}-Facing</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-gold)', fontStyle: 'italic', marginTop: '0.25rem' }}>{faceInfo.mantra}</div>
                    </div>
                    <p style={{ margin: '0 0 0.75rem', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Based on your {RASHI_NAMES[lagnaRashi as Rashi]} Ascendant: {faceInfo.why}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
                      Vastu Shastra: &quot;The door facing harmonious to Lagna ensures the master lives in alignment with their cosmic mandate.&quot;
                    </p>
                  </>
                )
              })()}
            </div>

            <div className="card" style={{ padding: '1.75rem' }}>
              <SectionTitle icon="📐" title="Dig Bala — Directional Strength" subtitle="Planetary directional strength (Shadbala component) from Parashari Jyotisha" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[
                  { planet: 'Ju', dir: 'East (Lagna)', label: 'Jupiter',  desc: 'Max strength in 1st bhava — wisdom, expansion, children' },
                  { planet: 'Su', dir: 'South (10H)',  label: 'Sun',      desc: 'Max strength in 10th bhava — career, authority, father' },
                  { planet: 'Sa', dir: 'West (7H)',    label: 'Saturn',   desc: 'Max strength in 7th bhava — longevity, discipline, service' },
                  { planet: 'Mo', dir: 'North (4H)',   label: 'Moon',     desc: 'Max strength in 4th bhava — mind, mother, domestic peace' },
                  { planet: 'Ma', dir: 'South (10H)',  label: 'Mars',     desc: 'Directional strength adds courage and property gains' },
                  { planet: 'Me', dir: 'North (1H)',   label: 'Mercury',  desc: 'Commerce and communication amplified in North-facing rooms' },
                ].map(d => {
                  const p = grahaMap[d.planet]
                  const strong = p?.dignity === 'exalted' || p?.dignity === 'own' || p?.dignity === 'moolatrikona'
                  const debil  = p?.dignity === 'debilitated'
                  return (
                    <div key={d.planet} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.85rem', background: 'var(--surface-2)', borderRadius: '10px', border: `1px solid ${strong ? 'rgba(78,205,196,0.25)' : debil ? 'rgba(224,123,142,0.2)' : 'var(--border-soft)'}` }}>
                      <span className="badge badge-accent" style={{ flexShrink: 0, minWidth: 28, textAlign: 'center' }}>{d.planet}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{d.label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.desc} · Optimal: {d.dir}</div>
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: strong ? 'var(--teal)' : debil ? 'var(--rose)' : 'var(--text-muted)', flexShrink: 0 }}>
                        {strong ? '⭐ Strong' : debil ? '⚠ Weak' : '— Neutral'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sleeping Direction */}
          <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--gold-dim)' }}>
            <SectionTitle icon="🛌" title="Shayana Vidhi — Sleeping Direction" subtitle="From Charaka Samhita & Vastu Shilpa — the science of optimal rest" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {SLEEP_DIRECTIONS.map(s => (
                <div key={s.head} style={{ padding: '1rem', background: 'var(--surface-2)', borderRadius: '12px', border: `1px solid ${s.col}44`, borderTop: `3px solid ${s.col}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 700, color: s.col, fontSize: '0.9rem' }}>Head → {s.head}</div>
                    <div style={{ fontSize: '0.9rem' }}>{s.icon}</div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{s.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--gold-faint)', borderRadius: '8px', border: '1px solid var(--border-bright)', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              📜 Charaka Samhita (Sutra 3.15): &quot;One should sleep with head toward South or East. Sleeping with head to North diminishes Ojas (vital essence) and shortens life.&quot;
            </div>
          </div>

          {/* Room Guide + Ashta Dikpalas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.75rem' }}>
              <SectionTitle icon="🏠" title="Room Placement Guide" subtitle="Optimal room locations per Vastu Shastra directives" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[
                  { room: 'Pooja / Meditation', icon: '🙏', best: 'NE', element: 'Jal',    desc: 'Ishan corner — Ishana Shiva. Greatest spiritual energy. Never store clutter.' },
                  { room: 'Kitchen',            icon: '🍳', best: 'SE', element: 'Agni',   desc: 'Agni corner — fire and transformation. Alternate: NW if SE unavailable.' },
                  { room: 'Master Bedroom',     icon: '🛌', best: 'SW', element: 'Prithvi',desc: 'SW gives stability, relationship security, restful sleep. Head → South.' },
                  { room: 'Living Room',        icon: '🛋️', best: 'E, NE', element: 'Vayu', desc: 'Solar morning light, social connectivity, welcoming guests.' },
                  { room: 'Study / Office',     icon: '📚', best: 'W, N', element: 'Akasha',desc: 'West gives gains from knowledge; North activates Kubera-Mercury energy.' },
                  { room: 'Children\'s Room',   icon: '🧒', best: 'W, NW', element: 'Akasha',desc: 'West supports education (Saturn); NW gives peer support.' },
                  { room: 'Dining',             icon: '🍽️', best: 'W, NW', element: 'Akasha',desc: 'Gains and nourishment axis. Face East while eating for solar energy.' },
                  { room: 'Toilet / Bathroom',  icon: '🚿', best: 'NW, SSW', element: 'Prithvi',desc: 'Disposal zone. Never in NE, SE, or SW. Vayu NW best for elimination.' },
                  { room: 'Storage / Utility',  icon: '📦', best: 'SSW, WNW', element: 'Prithvi',desc: 'Disposal and inertia zones. Ideal for non-essential storage.' },
                  { room: 'Staircase',          icon: '🪜', best: 'S, SW, W', element: 'Prithvi',desc: 'Always ascend toward South or West. Never in NE or center.' },
                ].map(r => {
                  const z = analysis.find(a => a.id === r.best.split(',')[0].trim())
                  const zScore = z?.score ?? 50
                  const sc = zScore > 65 ? 'var(--teal)' : zScore < 40 ? 'var(--rose)' : 'var(--gold)'
                  return (
                    <div key={r.room} style={{ padding: '0.8rem 0.9rem', background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--border-soft)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{r.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.room}</div>
                          <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-gold)', fontWeight: 700 }}>{r.best}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem', lineHeight: 1.4 }}>{r.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Ashta Dikpalas */}
              <div className="card" style={{ padding: '1.75rem' }}>
                <SectionTitle icon="🛡️" title="Aṣṭa Dikpālas" subtitle="Eight directional guardians — from Agni Purana & Vastu Shastra" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
                  {DIKPALAS.map(d => (
                    <div key={d.dir} style={{ padding: '0.7rem 0.8rem', background: 'var(--surface-2)', borderRadius: '8px', border: `1px solid ${d.color}33`, borderLeft: `3px solid ${d.color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: d.color }}>{d.dir}: {d.deity}</div>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Puja: {d.puja}</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{d.power}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Weapon: {d.weapon} · Mount: {d.mount}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Therapy */}
              <div className="card" style={{ padding: '1.75rem' }}>
                <SectionTitle icon="🎨" title="Zonal Color Therapy" subtitle="Vedic chromotherapy by direction — Varna Vastu Shastra" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                  {[
                    { zone: 'N',  color: '#3182ce', name: 'Blue',   planet: 'Me' },
                    { zone: 'NE', color: '#F0FFF4', name: 'White',  planet: 'Ju' },
                    { zone: 'E',  color: '#38a169', name: 'Green',  planet: 'Su' },
                    { zone: 'SE', color: '#e53e3e', name: 'Red',    planet: 'Ve' },
                    { zone: 'S',  color: '#c05621', name: 'Orange', planet: 'Ma' },
                    { zone: 'SW', color: '#ecc94b', name: 'Yellow', planet: 'Ra' },
                    { zone: 'W',  color: '#4a5568', name: 'Grey',   planet: 'Sa' },
                    { zone: 'NW', color: '#cbd5e0', name: 'Silver', planet: 'Mo' },
                  ].map(c => (
                    <div key={c.zone} style={{ textAlign: 'center' }}>
                      <div style={{ width: '100%', aspectRatio: '1', background: c.color, borderRadius: '50%', border: '3px solid var(--surface-3)', boxShadow: `0 4px 12px ${c.color}55`, marginBottom: '0.35rem' }} />
                      <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>{c.zone}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{c.name}</div>
                    </div>
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>Chromotherapy based on planetary rulership — colors amplify the planet&apos;s beneficial energy in each directional zone.</p>
              </div>
            </div>
          </div>

          {/* Vastu Plants */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <SectionTitle icon="🌿" title="Vastu Vriksha Shastra — Plant Placement" subtitle="Auspicious tree & plant placement from Brihat Samhita (Ch. 55) & Vastu Vidya" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.7rem' }}>
              {VASTU_PLANTS.map(p => (
                <div key={p.plant} style={{ padding: '0.85rem 1rem', background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--border-soft)', borderLeft: '4px solid var(--teal)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>🌿 {p.plant}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-gold)', marginBottom: '0.3rem', fontWeight: 600 }}>Place: {p.zone}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.35rem' }}>{p.benefit}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--rose)' }}>Avoid: {p.avoid}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: REMEDIES & YANTRAS
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'remedies' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* Priority Remedies */}
          <div className="card" style={{ padding: '1.75rem', borderLeft: '5px solid var(--rose)' }}>
            <SectionTitle icon="⚡" title="Priority Remedial Action Plan" subtitle="Personalized to your natal chart — zones most requiring correction" color="var(--rose)" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...analysis].filter(a => a.score < 50).sort((a, b) => a.score - b.score).slice(0, 7).map((z, idx) => {
                const ng = NAVAGRAHA_ZONES.find(n => n.dir === z.id)
                return (
                  <div key={z.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem 1.1rem', background: 'rgba(224,123,142,0.05)', borderRadius: '12px', border: '1px solid rgba(224,123,142,0.18)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: idx === 0 ? 'var(--rose)' : idx < 3 ? '#f97316' : 'var(--surface-3)', color: idx < 3 ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: '0.85rem' }}>{idx+1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.4rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{z.name} ({z.id})</div>
                        <span style={{ fontSize: '0.66rem', padding: '3px 8px', background: idx === 0 ? 'rgba(224,123,142,0.2)' : idx < 3 ? 'rgba(249,115,22,0.15)' : 'var(--surface-3)', color: idx === 0 ? 'var(--rose)' : idx < 3 ? '#f97316' : 'var(--text-muted)', borderRadius: '4px', fontWeight: 800, border: `1px solid ${idx === 0 ? 'rgba(224,123,142,0.4)' : idx < 3 ? 'rgba(249,115,22,0.35)' : 'var(--border)'}` }}>
                          {idx === 0 ? 'CRITICAL' : idx < 3 ? 'HIGH' : 'MEDIUM'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Score: {z.score}% · {z.quality} · {ELEM_ICON[z.element]} {z.element}</div>
                      <ScoreBar score={z.score} height={6} />
                      <div style={{ fontSize: '0.79rem', color: 'var(--text-secondary)', marginTop: '0.55rem', lineHeight: 1.5 }}>
                        Perform <strong>{GRAHA_NAMES[z.ruling as GrahaId]} (Graha Shanti)</strong> puja. Place {ELEM_ICON[z.element]} elemental markers in {z.id}.{ng ? ` Recite: "${ng.mantra.substring(0,40)}..."` : ''} Remove structural obstructions.
                      </div>
                    </div>
                  </div>
                )
              })}
              {analysis.every(a => a.score >= 50) && (
                <div style={{ textAlign: 'center', padding: '2.5rem', opacity: 0.65 }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
                  <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>No High-Priority Remedies Required</div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Your natal chart shows strong spatial harmony across all zones.</div>
                </div>
              )}
            </div>
          </div>

          {/* Yantra Placement */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <SectionTitle icon="🔯" title="Yantra Placement Guide" subtitle="From Tantric Vastu tradition — sacred geometric energy tools for each zone" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {YANTRA_GUIDE.map(y => (
                <div key={y.yantra} style={{ padding: '0.9rem 1rem', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--border-soft)', borderTop: '3px solid var(--gold)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-gold)', marginBottom: '0.35rem' }}>🔯 {y.yantra}</div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'var(--surface-3)', padding: '2px 7px', borderRadius: '4px' }}>📍 {y.zone}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'var(--surface-3)', padding: '2px 7px', borderRadius: '4px' }}>⚗️ {y.mat}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-gold)', background: 'var(--gold-faint)', padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--border-bright)' }}>🕐 {y.timing}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{y.purpose}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Metal Remedies */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <SectionTitle icon="⚙️" title="Dhātu Vastu — Metal & Element Remedies" subtitle="Correct metals for each direction — from Vastu Shastra Dhatu Prakarana" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.7rem' }}>
              {METAL_REMEDIES.map(m => {
                const z = analysis.find(a => a.id === m.dir)
                return (
                  <div key={m.dir} style={{ padding: '0.9rem 1rem', background: 'var(--surface-2)', borderRadius: '12px', border: `1px solid ${m.color}33`, borderLeft: `4px solid ${m.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: m.color }}>{m.dir} — {m.metal}</div>
                      {z && <span style={{ fontSize: '0.72rem', color: z.score > 65 ? 'var(--teal)' : z.score < 40 ? 'var(--rose)' : 'var(--gold)', fontWeight: 700 }}>{z.score}%</span>}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>{ELEM_ICON[m.bhuta.split(' ')[0]] || '✨'} {m.bhuta}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', lineHeight: 1.45 }}>
                      <strong>Place:</strong> {m.items}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--rose)', fontStyle: 'italic' }}>Avoid: {m.avoid}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Heatmap + Elemental Balance */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.75rem' }}>
              <SectionTitle icon="🔥" title="Zonal Energy Heatmap" subtitle="Relative energy saturation across all directions" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {[...analysis].sort((a, b) => b.score - a.score).map(z => {
                  const sc = z.score > 70 ? 'var(--teal)' : z.score < 40 ? 'var(--rose)' : 'var(--gold)'
                  return (
                    <div key={z.id} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <div style={{ width: 36, fontSize: '0.7rem', fontWeight: 700, color: sc, flexShrink: 0 }}>{z.id}</div>
                      <div style={{ flex: 1 }}><ScoreBar score={z.score} height={8} /></div>
                      <div style={{ width: 38, fontSize: '0.7rem', textAlign: 'right', color: sc, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{z.score}%</div>
                    </div>
                  )
                })}
              </div>
              <p style={{ margin: '1rem 0 0', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Zones &gt;75%: <strong style={{ color: 'var(--teal)' }}>Power Corridors</strong>. Zones &lt;40%: <strong style={{ color: 'var(--rose)' }}>Require Immediate Correction</strong>.
              </p>
            </div>

            <div className="card" style={{ padding: '1.75rem' }}>
              <SectionTitle icon="🌐" title="Elemental Equilibrium" subtitle="Pancha Bhuta balance across your chart" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[{ e: 'Jal', n: 'Water/Jal' }, { e: 'Agni', n: 'Fire/Agni' }, { e: 'Vayu', n: 'Air/Vayu' }, { e: 'Prithvi', n: 'Earth' }, { e: 'Akasha', n: 'Space' }].map(({ e, n }) => {
                  const count = analysis.filter(z => z.element === e || (e==='Jal'&&z.element==='Water') || (e==='Agni'&&z.element==='Fire') || (e==='Vayu'&&z.element==='Air') || (e==='Prithvi'&&z.element==='Earth') || (e==='Akasha'&&z.element==='Space')).reduce((acc, z) => acc + (z.occupants.length + z.score/20), 0)
                  const pct = Math.min(100, (count / 15) * 100)
                  const col = ELEM_COLOR[e] || 'var(--gold)'
                  return (
                    <div key={e}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        <span>{ELEM_ICON[e]} {n}</span>
                        <span style={{ color: col, fontWeight: 600 }}>{Math.round(pct)}%</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: col, opacity: 0.75, borderRadius: 3, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="divider" />

              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.08em' }}>🐚 Vastu Objects Placement</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {[
                    { obj: 'Water Fountain', zone: 'N, NE', icon: '⛲' },
                    { obj: 'Plants / Wood',  zone: 'E',     icon: '🌿' },
                    { obj: 'Fire Lamp',      zone: 'SE',    icon: '🕯️' },
                    { obj: 'Heavy Stone',    zone: 'SW',    icon: '🪨' },
                    { obj: 'Iron Chime',     zone: 'W, NW', icon: '🔔' },
                    { obj: 'Crystals',       zone: 'Center',icon: '💎' },
                    { obj: 'Sea Salt Bowl',  zone: 'SSW',   icon: '🧂' },
                    { obj: 'Copper Pyramid', zone: 'SE',    icon: '🔺' },
                  ].map(item => (
                    <div key={item.obj} style={{ padding: '0.42rem 0.75rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>{item.icon}</span>
                      <span style={{ fontWeight: 600 }}>{item.obj}</span>
                      <span style={{ color: 'var(--text-gold)', fontSize: '0.68rem' }}>{item.zone}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: BHAVA VASTU (Vedic Astro Vastu Synthesis)
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'bhavas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* ── Banner ── */}
          <div style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(139,92,246,0.08) 100%)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 'var(--r-lg)', padding: isSmall ? '0.85rem 1rem' : isMobile ? '1rem 1.25rem' : '1.25rem 1.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ fontSize: isSmall ? '1.5rem' : '2rem', flexShrink: 0, marginTop: '0.1rem' }}>📖</div>
            <div>
              <h3 style={{ margin: '0 0 0.2rem', color: 'var(--text-gold)', fontSize: isSmall ? '0.9rem' : '1rem', fontWeight: 700, lineHeight: 1.35 }}>Astro Vastu — Vedic Jyotish × Vastu Synthesis</h3>
              <p style={{ margin: 0, fontSize: isSmall ? '0.73rem' : '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Your natal Kundali mapped to your living space. Each of the 12 Bhavas governs a direction; each planet rules a Vastu zone.
              </p>
            </div>
          </div>

          {/* ── VISUAL: Bhava Chakra Wheel + Planet Compass ── */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.25rem' }}>

            {/* Bhava Chakra SVG Wheel */}
            <div className="card" style={{ padding: isSmall ? '1rem' : '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-gold)', fontSize: isSmall ? '0.82rem' : '0.88rem', marginBottom: '0.2rem', textAlign: 'center' }}>Bhava Chakra — House-Direction Wheel</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textAlign: 'center' }}>12 houses mapped to Vastu directions</div>
              {/* SVG fills container width */}
              <svg width="100%" viewBox="0 0 280 280" style={{ maxWidth: 300, display: 'block' }}>
                {(() => {
                  const cx = 140, cy = 140, outerR = 128, innerR = 52, midR = 78, planetR = 103, dirR = 118
                  const toRad = (d: number) => (d * Math.PI) / 180
                  return bhavaData.map((bh, i) => {
                    const startDeg = i * 30 - 15
                    const endDeg = startDeg + 30
                    const midDeg = i * 30
                    const ox1 = cx + outerR * Math.cos(toRad(startDeg))
                    const oy1 = cy + outerR * Math.sin(toRad(startDeg))
                    const ox2 = cx + outerR * Math.cos(toRad(endDeg))
                    const oy2 = cy + outerR * Math.sin(toRad(endDeg))
                    const ix1 = cx + innerR * Math.cos(toRad(endDeg))
                    const iy1 = cy + innerR * Math.sin(toRad(endDeg))
                    const ix2 = cx + innerR * Math.cos(toRad(startDeg))
                    const iy2 = cy + innerR * Math.sin(toRad(startDeg))
                    const segPath = `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 0 1 ${ox2} ${oy2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 0 0 ${ix2} ${iy2} Z`
                    const tx = cx + midR * Math.cos(toRad(midDeg))
                    const ty = cy + midR * Math.sin(toRad(midDeg))
                    const px = cx + planetR * Math.cos(toRad(midDeg))
                    const py = cy + planetR * Math.sin(toRad(midDeg))
                    const dx = cx + dirR * Math.cos(toRad(midDeg))
                    const dy = cy + dirR * Math.sin(toRad(midDeg))
                    const hasOccupants = bh.occupants.length > 0
                    return (
                      <g key={bh.h}>
                        <path d={segPath} fill={hasOccupants ? `${bh.color}45` : `${bh.color}18`} stroke={bh.color} strokeWidth={hasOccupants ? '1.2' : '0.6'} />
                        <text x={tx} y={ty - 4} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="bold" fill={bh.color}>{bh.h}</text>
                        <text x={tx} y={ty + 7} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill={bh.color} opacity="0.8">{bh.icon}</text>
                        {/* Planet abbreviations */}
                        {bh.occupants.slice(0, 3).map((g: { id: string; isRetro?: boolean }, gi: number) => (
                          <text key={g.id}
                            x={px + (gi - (bh.occupants.length - 1) / 2) * 11}
                            y={py}
                            textAnchor="middle" dominantBaseline="middle"
                            fontSize="6.5" fontWeight="800"
                            fill={PLANET_PROFILES[g.id]?.color ?? bh.color}
                          >{g.id}{g.isRetro ? 'ᴿ' : ''}</text>
                        ))}
                        <text x={dx} y={dy} textAnchor="middle" dominantBaseline="middle" fontSize="5.5" fill={bh.color} opacity="0.75">{bh.dir}</text>
                      </g>
                    )
                  })
                })()}
                <circle cx={140} cy={140} r={48} fill="var(--surface-3)" stroke="rgba(201,168,76,0.35)" strokeWidth="1" />
                <text x={140} y={133} textAnchor="middle" fontSize="9.5" fill="var(--text-gold)" fontWeight="700">BHAVA</text>
                <text x={140} y={146} textAnchor="middle" fontSize="9.5" fill="var(--text-gold)" fontWeight="700">CHAKRA</text>
                <text x={140} y={159} textAnchor="middle" fontSize="7" fill="var(--text-muted)">Jyotish × Vastu</text>
                <text x={140} y={7}   textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(201,168,76,0.7)">N</text>
                <text x={273} y={144} textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(201,168,76,0.7)">E</text>
                <text x={140} y={277} textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(201,168,76,0.7)">S</text>
                <text x={7}   y={144} textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(201,168,76,0.7)">W</text>
              </svg>
              {/* Mobile-friendly legend chips instead of long text */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', justifyContent: 'center', marginTop: '0.6rem' }}>
                {BHAVA_MAP.map(bh => (
                  <span key={bh.h} style={{ fontSize: '0.6rem', background: `${bh.color}18`, color: bh.color, border: `1px solid ${bh.color}40`, borderRadius: '10px', padding: '1px 6px', whiteSpace: 'nowrap' }}>H{bh.h}·{bh.dir}</span>
                ))}
              </div>
            </div>

            {/* Planet-Direction Compass Grid */}
            <div className="card" style={{ padding: isSmall ? '1rem' : '1.5rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-gold)', fontSize: isSmall ? '0.82rem' : '0.88rem', marginBottom: '0.2rem' }}>Planet Compass — Graha Direction Map</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Which planet rules which Vastu zone</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: isSmall ? '0.3rem' : '0.4rem' }}>
                {[
                  { dir: 'NW', label: 'Moon',    sym: '🌙', theme: 'Banking · Emotions',       color: '#e2e8f0', h: '6' },
                  { dir: 'N',  label: 'Mercury', sym: '☿',  theme: 'Career · Business',        color: '#22c55e', h: '7' },
                  { dir: 'NE', label: 'Jupiter', sym: '♃',  theme: 'Fortune · Blessings',      color: '#DAA520', h: '9' },
                  { dir: 'W',  label: 'Saturn',  sym: '♄',  theme: 'Gains · Discipline',       color: '#94a3b8', h: '5' },
                  { dir: 'C',  label: 'Brahma',  sym: '☸',  theme: 'Centre · Balance',         color: '#DAA520', h: '' },
                  { dir: 'E',  label: 'Sun',     sym: '☀',  theme: 'Self · Authority',         color: '#f59e0b', h: '1' },
                  { dir: 'SW', label: 'Rahu',    sym: '☊',  theme: 'Stability · Desire',       color: '#7c3aed', h: '4' },
                  { dir: 'S',  label: 'Mars',    sym: '♂',  theme: 'Courage · Energy',         color: '#ef4444', h: '3' },
                  { dir: 'SE', label: 'Venus',   sym: '♀',  theme: 'Wealth · Cash Flow',       color: '#ec4899', h: '2' },
                ].map(cell => (
                  <div key={cell.dir} style={{ background: cell.dir === 'C' ? 'rgba(201,168,76,0.12)' : `${cell.color}12`, border: `1px solid ${cell.color}35`, borderRadius: '8px', padding: isSmall ? '0.4rem 0.2rem' : '0.55rem 0.35rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.12rem' }}>
                    <span style={{ fontSize: isSmall ? '1rem' : '1.1rem' }}>{cell.sym}</span>
                    <div style={{ fontSize: isSmall ? '0.62rem' : '0.65rem', fontWeight: 800, color: cell.color }}>{cell.dir}</div>
                    <div style={{ fontSize: isSmall ? '0.6rem' : '0.64rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cell.label}</div>
                    <div style={{ fontSize: isSmall ? '0.52rem' : '0.56rem', color: 'var(--text-muted)', lineHeight: 1.25 }}>{cell.theme}</div>
                    {cell.h && <div style={{ fontSize: '0.52rem', background: `${cell.color}22`, color: cell.color, borderRadius: '3px', padding: '1px 4px', fontWeight: 700 }}>H{cell.h}</div>}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.6rem', background: 'rgba(139,92,246,0.08)', borderRadius: 'var(--r-sm)', fontSize: isSmall ? '0.62rem' : '0.66rem', color: '#a78bfa', lineHeight: 1.5 }}>
                ★ <strong>NNE = Ketu</strong> (H8 · Research) &nbsp;·&nbsp; <strong>ENE = Sun</strong> (H10 · Career)
              </div>
            </div>
          </div>

          {/* ── Lagna Rashi Profile ── */}
          {(() => {
            const lagnaRashi = chart.lagnas?.ascRashi ?? 1
            const rp = RASHI_PROFILES[lagnaRashi] || RASHI_PROFILES[1]
            const lagnaLordId = rp.lord as GrahaId
            const pp = PLANET_PROFILES[rp.lord]
            return (
              <div className="card" style={{ padding: isMobile ? '1.25rem' : '1.75rem' }}>
                <SectionTitle icon="♋" title="Your Lagna (Ascendant) Profile" subtitle="Your rising sign shapes the entire energetic identity of your home" />
                {/* On mobile: symbol+name row on top, lord+tip side by side below */}
                {isMobile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Top: rashi identity bar */}
                    <div style={{ background: `${pp?.color ?? '#DAA520'}12`, border: `2px solid ${pp?.color ?? '#DAA520'}40`, borderRadius: 'var(--r-md)', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '2.2rem', flexShrink: 0 }}>{rp.symbol}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: pp?.color ?? 'var(--text-gold)', fontSize: '1rem' }}>{RASHI_NAMES[lagnaRashi as keyof typeof RASHI_NAMES]} Lagna</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{rp.element} Sign · {rp.quality}</div>
                      </div>
                    </div>
                    {/* Bottom: lord + tip side by side */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: '0.85rem' }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Lagna Lord</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: pp?.color, marginBottom: '0.3rem' }}>{GRAHA_NAMES[lagnaLordId]}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Zone: <strong style={{ color: 'var(--text-primary)' }}>{pp?.vastuDir}</strong></div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Element: <strong style={{ color: 'var(--text-primary)' }}>{pp?.element}</strong></div>
                      </div>
                      <div style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 'var(--r-md)', padding: '0.85rem' }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-gold)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>🏠 Activation</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-gold)', lineHeight: 1.5 }}>{rp.advice}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: `${pp?.color ?? '#DAA520'}12`, border: `2px solid ${pp?.color ?? '#DAA520'}44`, borderRadius: 'var(--r-md)', padding: '1.1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>{rp.symbol}</div>
                      <div style={{ fontWeight: 700, color: pp?.color ?? 'var(--text-gold)', fontSize: '0.95rem' }}>{RASHI_NAMES[lagnaRashi as keyof typeof RASHI_NAMES]}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.2rem 0 0.6rem' }}>{rp.element} Sign</div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rp.quality}</div>
                    </div>
                    <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: '1.1rem' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lagna Lord</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: pp?.color, marginBottom: '0.4rem' }}>{GRAHA_NAMES[lagnaLordId]}</div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Vastu Zone: <strong style={{ color: 'var(--text-primary)' }}>{pp?.vastuDir}</strong></div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>Element: <strong style={{ color: 'var(--text-primary)' }}>{pp?.element}</strong></div>
                      {pp && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{pp.core}</div>}
                    </div>
                    <div style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 'var(--r-md)', padding: '1.1rem' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-gold)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🏠 Vastu Activation</div>
                      <div style={{ fontSize: '0.77rem', color: 'var(--text-gold)', lineHeight: 1.6, marginBottom: '0.6rem' }}>{rp.advice}</div>
                      {pp && <div style={{ fontSize: '0.72rem', color: '#a78bfa', lineHeight: 1.5, background: 'rgba(139,92,246,0.08)', padding: '0.5rem', borderRadius: 'var(--r-sm)' }}>🔑 {pp.spatial}</div>}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── VISUAL: 12-Bhava Reference — cards on mobile, table on desktop ── */}
          <div className="card" style={{ padding: isMobile ? '1rem' : '1.75rem' }}>
            <SectionTitle icon="🗺️" title="12-Bhava Spatial Reference" subtitle="House · Rashi · Lord placement · Planets in house · Vastu zone" />
            {isMobile ? (
              /* Mobile: compact card grid 2-column */
              <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : 'repeat(2, 1fr)', gap: '0.6rem' }}>
                {bhavaData.map(bh => {
                  const qColor = bh.qualityEntry?.quality === 'excellent' ? 'var(--teal)' : bh.qualityEntry?.quality === 'strong' ? '#3b82f6' : bh.qualityEntry?.quality === 'good' ? 'var(--gold)' : bh.qualityEntry?.quality === 'weak' ? 'var(--rose)' : '#ef4444'
                  return (
                    <div key={bh.h} style={{ background: bh.occupants.length > 0 ? `${bh.color}08` : 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: '0.75rem', borderLeft: `3px solid ${bh.color}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${bh.color}25`, border: `1.5px solid ${bh.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem', color: bh.color, flexShrink: 0 }}>{bh.h}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.78rem', color: bh.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bh.icon} {bh.name}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{RASHI_NAMES[bh.houseRashi as Rashi]} · Lord: <strong style={{ color: PLANET_PROFILES[bh.lordId]?.color ?? 'var(--text-secondary)' }}>{GRAHA_NAMES[bh.lordId as GrahaId] ?? bh.lordId}</strong> (H{bh.lordHouse})</div>
                        </div>
                        <span style={{ background: `${bh.color}20`, color: bh.color, borderRadius: '4px', padding: '1px 6px', fontWeight: 800, fontSize: '0.65rem', flexShrink: 0 }}>{bh.dir}</span>
                      </div>
                      {/* Planet occupants */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.3rem', minHeight: '1.3rem' }}>
                        {bh.occupants.length > 0
                          ? bh.occupants.map((g: { id: string; dignity?: string; isRetro?: boolean }) => (
                              <span key={g.id} style={{ fontSize: '0.6rem', fontWeight: 700, background: `${PLANET_PROFILES[g.id]?.color ?? '#888'}22`, color: PLANET_PROFILES[g.id]?.color ?? 'var(--text-secondary)', border: `1px solid ${PLANET_PROFILES[g.id]?.color ?? '#888'}44`, borderRadius: '4px', padding: '1px 5px' }}>
                                {g.id}{g.isRetro ? 'ᴿ' : ''}{g.dignity === 'exalted' ? '↑' : g.dignity === 'debilitated' ? '↓' : ''}
                              </span>
                            ))
                          : <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Empty</span>
                        }
                        {bh.qualityEntry && (
                          <span style={{ marginLeft: 'auto', fontSize: '0.58rem', color: qColor, fontWeight: 700, background: `${qColor}18`, borderRadius: '4px', padding: '1px 5px' }}>
                            {bh.qualityEntry.quality}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: bh.color, lineHeight: 1.4 }}>💡 {bh.dynamicTip}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Desktop: full table with chart data */
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(201,168,76,0.08)' }}>
                      {['H#', 'Sanskrit', 'Rashi', 'Lord (H)', 'Planets in House', 'Lord Quality', 'Zone', 'Vastu Insight'].map(h => (
                        <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bhavaData.map((bh, i) => {
                      const qColor = bh.qualityEntry?.quality === 'excellent' ? 'var(--teal)' : bh.qualityEntry?.quality === 'strong' ? '#3b82f6' : bh.qualityEntry?.quality === 'good' ? 'var(--gold)' : bh.qualityEntry?.quality === 'weak' ? 'var(--rose)' : '#ef4444'
                      return (
                        <tr key={bh.h} style={{ borderBottom: '1px solid var(--surface-3)', background: bh.occupants.length > 0 ? `${bh.color}06` : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${bh.color}25`, border: `1.5px solid ${bh.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.72rem', color: bh.color }}>{bh.h}</div>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 700, color: bh.color, fontSize: '0.75rem' }}>{bh.icon} {bh.name}</div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{bh.eng}</div>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                            {bh.rashiProfile?.symbol} {RASHI_NAMES[bh.houseRashi as Rashi]}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 700, color: PLANET_PROFILES[bh.lordId]?.color ?? 'var(--text-primary)', fontSize: '0.74rem' }}>
                              {GRAHA_NAMES[bh.lordId as GrahaId] ?? bh.lordId}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>H{bh.lordHouse}</span>
                            {bh.lordGraha?.isRetro && <span style={{ fontSize: '0.58rem', color: 'var(--rose)', marginLeft: '0.2rem' }}>ᴿ</span>}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                              {bh.occupants.length > 0
                                ? bh.occupants.map((g: { id: string; dignity?: string; isRetro?: boolean }) => (
                                    <span key={g.id} style={{ fontSize: '0.65rem', fontWeight: 700, background: `${PLANET_PROFILES[g.id]?.color ?? '#888'}22`, color: PLANET_PROFILES[g.id]?.color ?? 'var(--text-secondary)', border: `1px solid ${PLANET_PROFILES[g.id]?.color ?? '#888'}44`, borderRadius: '4px', padding: '1px 6px', whiteSpace: 'nowrap' }}>
                                      {g.id}{g.isRetro ? 'ᴿ' : ''}{g.dignity === 'exalted' ? '↑' : g.dignity === 'debilitated' ? '↓' : ''}
                                    </span>
                                  ))
                                : <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                              }
                            </div>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            {bh.qualityEntry && (
                              <span style={{ fontSize: '0.65rem', color: qColor, background: `${qColor}18`, borderRadius: '4px', padding: '2px 7px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {bh.qualityEntry.quality}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <span style={{ background: `${bh.color}20`, color: bh.color, borderRadius: '5px', padding: '2px 8px', fontWeight: 800, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{bh.dir}</span>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.7rem', maxWidth: '240px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-primary)' }}>{bh.room}</div>
                            <div style={{ lineHeight: 1.4, color: bh.color }}>💡 {bh.dynamicTip}</div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── VISUAL: Planet Profiles Grid ── */}
          <div className="card" style={{ padding: isMobile ? '1.25rem' : '1.75rem' }}>
            <SectionTitle icon="🪐" title="Graha Vastu Profile Cards" subtitle="Your natal planet positions mapped to Vastu spatial zones" />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? (isSmall ? '1fr' : 'repeat(2, 1fr)') : 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {Object.entries(PLANET_PROFILES).map(([gId, pp]) => {
                const grahaName = GRAHA_NAMES[gId as GrahaId] || gId
                const g = chart.grahas?.find((gr: { id: string }) => gr.id === gId) as
                  { id: string; rashi: number; degree: number; dignity?: string; isRetro?: boolean; speed?: number } | undefined
                if (!g) return null
                const houseNum = ((g.rashi - ((chart.lagnas?.ascRashi ?? 1) as number) + 12) % 12) + 1
                const dignityLabel = g.dignity === 'exalted' ? 'Exalted ↑' : g.dignity === 'own' ? 'Own Sign' : g.dignity === 'moolatrikona' ? 'Moolatrikona' : g.dignity === 'debilitated' ? 'Debilitated ↓' : 'Neutral'
                const dignityColor = g.dignity === 'exalted' ? 'var(--teal)' : g.dignity === 'own' ? 'var(--gold)' : g.dignity === 'moolatrikona' ? 'var(--accent)' : g.dignity === 'debilitated' ? 'var(--rose)' : 'var(--text-muted)'
                const strengthScore = g.dignity === 'exalted' ? 95 : g.dignity === 'own' ? 80 : g.dignity === 'moolatrikona' ? 85 : g.dignity === 'debilitated' ? 15 : g.isRetro ? 45 : 55
                const rashiName = RASHI_NAMES[g.rashi as Rashi] ?? `R${g.rashi}`
                return (
                  <div key={gId} style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', overflow: 'hidden', border: `1px solid ${pp.color}35` }}>
                    {/* Card Header */}
                    <div style={{ background: `${pp.color}18`, padding: isMobile ? '0.6rem 0.75rem' : '0.75rem 1rem', borderBottom: `2px solid ${pp.color}50`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: isMobile ? 30 : 36, height: isMobile ? 30 : 36, borderRadius: '50%', background: `${pp.color}28`, border: `2px solid ${pp.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '0.65rem' : '0.75rem', fontWeight: 800, color: pp.color, flexShrink: 0 }}>{gId}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: isMobile ? '0.8rem' : '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          {grahaName}
                          {g.isRetro && <span style={{ fontSize: '0.55rem', background: 'rgba(224,123,142,0.2)', color: 'var(--rose)', borderRadius: '3px', padding: '0 4px', fontWeight: 800 }}>ᴿ</span>}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{pp.element}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ background: `${pp.color}22`, color: pp.color, borderRadius: '5px', padding: '1px 6px', fontWeight: 800, fontSize: '0.64rem' }}>{pp.vastuDir}</div>
                      </div>
                    </div>

                    {/* Chart Position Strip */}
                    <div style={{ display: 'flex', gap: '0.3rem', padding: '0.45rem 0.75rem', background: 'var(--surface-3)', borderBottom: '1px solid var(--border-soft)', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Your chart:</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: pp.color, background: `${pp.color}18`, borderRadius: '4px', padding: '1px 6px' }}>
                        {rashiName}
                      </span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{g.degree.toFixed(1)}°</span>
                      <span style={{ fontSize: '0.62rem', background: `${dignityColor}20`, color: dignityColor, borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>{dignityLabel}</span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>H{houseNum}</span>
                    </div>

                    {/* Strength bar */}
                    <div style={{ padding: '0.3rem 0.75rem', background: 'var(--surface-3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                        <span>Planetary Strength</span>
                        <span style={{ color: dignityColor, fontWeight: 700 }}>{strengthScore}%</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${strengthScore}%`, background: `linear-gradient(90deg, ${dignityColor}, ${dignityColor}88)`, borderRadius: 3, transition: 'width 1s ease' }} />
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: isMobile ? '0.6rem 0.75rem' : '0.65rem 1rem' }}>
                      {!isSmall && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>❤️ {pp.health}</div>}
                      <div style={{ background: 'rgba(201,168,76,0.07)', borderRadius: 'var(--r-sm)', padding: '0.4rem 0.5rem', fontSize: '0.65rem', color: 'var(--text-gold)', lineHeight: 1.4, marginBottom: '0.35rem' }}>
                        🏠 {pp.spatial.split('.')[0]}.
                      </div>
                      <div style={{ background: `${pp.color}10`, borderRadius: 'var(--r-sm)', padding: '0.35rem 0.5rem', fontSize: '0.64rem', color: pp.color, lineHeight: 1.35 }}>
                        💎 {pp.remedy.split(',')[0]}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── VISUAL: House Lord Quality Chart + Life Area Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>

            {/* House Lord Quality Chart — real chart data */}
            <div className="card" style={{ padding: isMobile ? '1.25rem' : '1.75rem' }}>
              <SectionTitle icon="📊" title="House Lord Quality — Your Chart" subtitle="Where your lord sits determines each life zone's spatial energy" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {bhavaData.map(bh => {
                  const q = bh.qualityEntry
                  const qPct = q?.quality === 'excellent' ? 100 : q?.quality === 'strong' ? 80 : q?.quality === 'good' ? 65 : q?.quality === 'weak' ? 35 : 15
                  const qColor = q?.quality === 'excellent' ? 'var(--teal)' : q?.quality === 'strong' ? '#3b82f6' : q?.quality === 'good' ? 'var(--gold)' : q?.quality === 'weak' ? 'var(--rose)' : '#ef4444'
                  const qIcon = q?.quality === 'excellent' ? '⭐' : q?.quality === 'strong' ? '💪' : q?.quality === 'good' ? '✅' : q?.quality === 'weak' ? '⚠️' : '🔴'
                  const lordPP = PLANET_PROFILES[bh.lordId]
                  return (
                    <div key={bh.h} style={{ padding: '0.5rem 0.65rem', background: 'var(--surface-2)', borderRadius: '8px', borderLeft: `3px solid ${qColor}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem' }}>{qIcon}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: bh.color }}>{bh.icon} H{bh.h} {bh.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.65rem', color: lordPP?.color ?? 'var(--text-secondary)', fontWeight: 700 }}>
                            {GRAHA_NAMES[bh.lordId as GrahaId] ?? bh.lordId}
                          </span>
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>→ H{bh.lordHouse}</span>
                          <span style={{ fontSize: '0.6rem', background: `${qColor}22`, color: qColor, borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>{q?.quality ?? '—'}</span>
                        </div>
                      </div>
                      <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${qPct}%`, background: `linear-gradient(90deg, ${qColor}, ${qColor}77)`, borderRadius: 4, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ background: 'rgba(201,168,76,0.07)', borderRadius: 'var(--r-sm)', padding: '0.6rem 0.75rem', fontSize: '0.7rem', color: 'var(--text-gold)', lineHeight: 1.5, marginTop: '0.75rem' }}>
                💡 Each row shows: which house lord rules the house, which house it sits in, and the resulting quality of that life area&apos;s spatial energy.
              </div>
            </div>

            {/* Life Area Visual Cards */}
            <div className="card" style={{ padding: isMobile ? '1.25rem' : '1.75rem' }}>
              <SectionTitle icon="🔗" title="Life Area → Zone Map" subtitle="Your goal determines which spatial zone to activate" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[
                  { icon: '💼', area: 'Career',      h: '10', zone: 'ENE', room: 'Home Office',   planet: 'Su', color: '#f59e0b' },
                  { icon: '💰', area: 'Wealth',       h: '2',  zone: 'SE',  room: 'Kitchen',       planet: 'Ve', color: '#ec4899' },
                  { icon: '🙏', area: 'Fortune',      h: '9',  zone: 'NE',  room: 'Puja Room',     planet: 'Ju', color: '#DAA520' },
                  { icon: '💍', area: 'Marriage',     h: '7',  zone: 'N',   room: 'Guest Room',    planet: 'Me', color: '#22c55e' },
                  { icon: '🏠', area: 'Home Peace',   h: '4',  zone: 'SW',  room: 'Master Bed',    planet: 'Ra', color: '#7c3aed' },
                  { icon: '👶', area: 'Children',     h: '5',  zone: 'W',   room: "Kids' Room",    planet: 'Sa', color: '#94a3b8' },
                  { icon: '⚕️', area: 'Health',       h: '6',  zone: 'NW',  room: 'Utility',       planet: 'Mo', color: '#e2e8f0' },
                  { icon: '📈', area: 'Gains',        h: '11', zone: 'NNW', room: 'Garden/Social', planet: 'Me', color: '#22c55e' },
                  { icon: '💪', area: 'Courage',      h: '3',  zone: 'S',   room: 'Gym',           planet: 'Ma', color: '#ef4444' },
                  { icon: '🔬', area: 'Research',     h: '8',  zone: 'NNE', room: 'Safe/Store',    planet: 'Ke', color: '#a78bfa' },
                  { icon: '🧘', area: 'Spiritual',    h: '12', zone: 'WNW', room: 'Meditation',    planet: 'Ju', color: '#6366f1' },
                  { icon: '🧍', area: 'Self',         h: '1',  zone: 'E',   room: 'Main Entry',    planet: 'Su', color: '#f59e0b' },
                ].map(row => (
                  <div key={row.area} style={{ display: 'flex', alignItems: 'center', gap: isSmall ? '0.35rem' : '0.5rem', padding: isSmall ? '0.3rem 0.4rem' : '0.35rem 0.5rem', borderRadius: '6px', background: 'var(--surface-2)' }}>
                    <span style={{ fontSize: isSmall ? '0.85rem' : '0.95rem', flexShrink: 0 }}>{row.icon}</span>
                    <div style={{ width: isSmall ? 68 : 80, flexShrink: 0 }}>
                      <div style={{ fontSize: isSmall ? '0.68rem' : '0.73rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.area}</div>
                      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>H{row.h}</div>
                    </div>
                    <div style={{ flex: 1, height: 5, background: 'var(--surface-3)', borderRadius: 3, minWidth: 0 }}>
                      <div style={{ height: '100%', width: '100%', background: `linear-gradient(90deg, ${row.color}88, ${row.color}22)`, borderRadius: 3 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                      <span style={{ background: `${row.color}22`, color: row.color, borderRadius: '4px', padding: '1px 5px', fontSize: isSmall ? '0.6rem' : '0.65rem', fontWeight: 800 }}>{row.zone}</span>
                      {!isMobile && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{row.room}</span>}
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${row.color}22`, border: `1.5px solid ${row.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.52rem', fontWeight: 800, color: row.color, flexShrink: 0 }}>{row.planet}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Astro-Vastu Personalised Action Plan */}
          <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem' }}>
            <SectionTitle icon="🎯" title="Personalised Astro-Vastu Action Plan" subtitle="Priority spatial activations derived from your Lagna and planetary positions" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(() => {
                const lagnaRashi = chart.lagnas?.ascRashi ?? 1
                const rp = RASHI_PROFILES[lagnaRashi] || RASHI_PROFILES[1]
                const lagnaLordKey = rp.lord
                const pp = PLANET_PROFILES[lagnaLordKey]
                const actions = [
                  { priority: 1, zone: pp?.vastuDir || 'E', action: `Activate your Lagna Lord (${GRAHA_NAMES[lagnaLordKey as GrahaId]}) zone — ${pp?.vastuDir || 'E'}`, detail: pp?.spatial || '', color: '#DAA520', icon: '⭐' },
                  { priority: 2, zone: 'NE', action: 'Energise NE (9th Bhava/Fortune Zone)', detail: 'Puja room or sacred corner in NE. Remove all clutter and toilet from this zone. Light ghee lamp daily.', color: 'var(--teal)', icon: '🙏' },
                  { priority: 3, zone: 'SW', action: 'Stabilise SW (4th Bhava/Home Comfort Zone)', detail: 'Master bedroom in SW with head facing South. Heavy wardrobes in SW corner. No cuts or missing corners in SW.', color: '#3b82f6', icon: '🏠' },
                  { priority: 4, zone: 'ENE', action: 'Activate ENE for Career (10th Bhava)', detail: 'Home office or work desk facing ENE or N. Professional awards in ENE zone. Sun yantra in East wall.', color: '#f59e0b', icon: '💼' },
                  { priority: 5, zone: 'SE', action: 'Maintain SE Kitchen (2nd Bhava/Wealth)', detail: 'Kitchen stove in SE. Cooking facing East. Cash locker away from SW only if Rahu is malefic. Agni deepam in SE.', color: '#ef4444', icon: '💰' },
                ].concat(
                  (chart.grahas as Array<{ id: string; lonSidereal: number; isRetro?: boolean }> || [])
                    .filter(g => g.isRetro)
                    .slice(0, 2)
                    .map((g, i) => {
                      const ppp = PLANET_PROFILES[g.id] || { vastuDir: '?', spatial: '' }
                      return {
                        priority: 6 + i,
                        zone: ppp.vastuDir,
                        action: `Remedy ${GRAHA_NAMES[g.id as GrahaId]} (Retrograde) — ${ppp.vastuDir} zone`,
                        detail: `Retrograde ${GRAHA_NAMES[g.id as GrahaId]} needs special spatial attention. ${ppp.spatial}`,
                        color: '#a78bfa',
                        icon: '🔄'
                      }
                    })
                )
                return actions.map(act => (
                  <div key={act.priority} style={{ display: 'flex', gap: isSmall ? '0.6rem' : '1rem', alignItems: 'flex-start', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: isSmall ? '0.75rem' : '1rem', borderLeft: `3px solid ${act.color}` }}>
                    <div style={{ width: isSmall ? 26 : 32, height: isSmall ? 26 : 32, borderRadius: '50%', background: `${act.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isSmall ? '0.85rem' : '1rem', flexShrink: 0 }}>{act.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: isSmall ? '0.82rem' : '0.88rem', color: 'var(--text-primary)', marginBottom: '0.25rem', lineHeight: 1.4 }}>
                        <span style={{ background: `${act.color}22`, color: act.color, borderRadius: '4px', padding: '1px 5px', fontSize: '0.64rem', fontWeight: 700, marginRight: '0.4rem' }}>P{act.priority}</span>
                        {act.action}
                      </div>
                      <div style={{ fontSize: isSmall ? '0.72rem' : '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{act.detail}</div>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>

          {/* ── VISUAL: 12 Rashi Quick Reference — cards on mobile, table on desktop ── */}
          <div className="card" style={{ padding: isMobile ? '1rem' : '1.75rem' }}>
            <SectionTitle icon="♊" title="12 Rashi Vastu Quick Reference" subtitle="Each zodiac sign's spatial energy and Vastu activation tip" />
            {isMobile ? (
              /* Mobile: 2-col card grid */
              <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : 'repeat(2, 1fr)', gap: '0.6rem', marginBottom: '0.75rem' }}>
                {Object.entries(RASHI_PROFILES).map(([num, rp]) => {
                  const isLagna = parseInt(num) === (chart.lagnas?.ascRashi ?? 1)
                  return (
                    <div key={num} style={{ background: isLagna ? `${rp.vastuColor}10` : 'var(--surface-2)', border: `1.5px solid ${rp.vastuColor}${isLagna ? '60' : '25'}`, borderRadius: 'var(--r-md)', padding: '0.7rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{rp.symbol}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: isLagna ? 700 : 600, fontSize: '0.78rem', color: rp.vastuColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {RASHI_NAMES[parseInt(num) as keyof typeof RASHI_NAMES]}
                            {isLagna && <span style={{ marginLeft: '0.3rem', fontSize: '0.52rem', background: 'var(--gold)', color: '#000', borderRadius: '3px', padding: '0 4px', fontWeight: 800, verticalAlign: 'middle' }}>YOU</span>}
                          </div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                            <span style={{ background: ELEM_COLOR[rp.element] ? `${ELEM_COLOR[rp.element]}22` : 'var(--surface-3)', color: ELEM_COLOR[rp.element] || 'var(--text-muted)', borderRadius: '3px', padding: '0 4px' }}>{ELEM_ICON[rp.element]} {rp.element}</span>
                            {' · '}{GRAHA_NAMES[rp.lord as GrahaId]}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: rp.vastuColor, lineHeight: 1.4 }}>{rp.advice}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Desktop: 6-column table */
              <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(201,168,76,0.07)' }}>
                      {['Sign', 'Rashi', 'Element', 'Lord', 'Character', 'Vastu Activation'].map(h => (
                        <th key={h} style={{ padding: '0.5rem 0.65rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.63rem', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(RASHI_PROFILES).map(([num, rp], i) => {
                      const isLagna = parseInt(num) === (chart.lagnas?.ascRashi ?? 1)
                      return (
                        <tr key={num} style={{ borderBottom: '1px solid var(--surface-3)', background: isLagna ? `${rp.vastuColor}0a` : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '0.45rem 0.65rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontSize: '1.1rem' }}>{rp.symbol}</span>
                              {isLagna && <span style={{ fontSize: '0.55rem', background: 'var(--gold)', color: '#000', borderRadius: '3px', padding: '1px 4px', fontWeight: 800 }}>YOU</span>}
                            </div>
                          </td>
                          <td style={{ padding: '0.45rem 0.65rem', fontWeight: isLagna ? 700 : 600, color: rp.vastuColor, whiteSpace: 'nowrap', fontSize: '0.74rem' }}>{RASHI_NAMES[parseInt(num) as keyof typeof RASHI_NAMES]}</td>
                          <td style={{ padding: '0.45rem 0.65rem' }}>
                            <span style={{ background: ELEM_COLOR[rp.element] ? `${ELEM_COLOR[rp.element]}22` : 'var(--surface-3)', color: ELEM_COLOR[rp.element] || 'var(--text-muted)', borderRadius: '4px', padding: '1px 6px', fontSize: '0.65rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {ELEM_ICON[rp.element] || ''} {rp.element}
                            </span>
                          </td>
                          <td style={{ padding: '0.45rem 0.65rem', color: 'var(--text-secondary)', fontSize: '0.73rem' }}>{GRAHA_NAMES[rp.lord as GrahaId]}</td>
                          <td style={{ padding: '0.45rem 0.65rem', color: 'var(--text-muted)', fontSize: '0.71rem', maxWidth: 160 }}>{rp.quality}</td>
                          <td style={{ padding: '0.45rem 0.65rem', color: rp.vastuColor, fontSize: '0.7rem', maxWidth: 200 }}>{rp.advice}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* Compact Rashi chips — always visible */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: isMobile ? '0.5rem' : 0 }}>
              {Object.entries(RASHI_PROFILES).map(([num, rp]) => {
                const isLagna = parseInt(num) === (chart.lagnas?.ascRashi ?? 1)
                return (
                  <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: isLagna ? `${rp.vastuColor}22` : 'var(--surface-2)', border: `1px solid ${rp.vastuColor}${isLagna ? '70' : '30'}`, borderRadius: '20px', padding: '2px 8px 2px 5px' }}>
                    <span style={{ fontSize: '0.85rem' }}>{rp.symbol}</span>
                    <span style={{ fontSize: '0.6rem', fontWeight: isLagna ? 700 : 500, color: isLagna ? rp.vastuColor : 'var(--text-muted)' }}>{RASHI_NAMES[parseInt(num) as keyof typeof RASHI_NAMES]?.split(' ')[0]}</span>
                    {isLagna && <span style={{ fontSize: '0.5rem', background: 'var(--gold)', color: '#000', borderRadius: '3px', padding: '0 3px', fontWeight: 800 }}>L</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Astro Vastu Core Principle */}
          <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(201,168,76,0.08))', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 'var(--r-lg)', padding: isMobile ? '1.25rem' : '1.75rem' }}>
            <h4 style={{ margin: '0 0 0.75rem', color: 'var(--text-gold)', fontSize: '0.95rem' }}>Core Principle of Vedic Astro Vastu</h4>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Astro Vastu integrates the principles of Vastu Shastra with insights from Jyotish (Vedic Astrology). The goal is to enhance positive energy and overall well-being by aligning living spaces with both Vastu directional principles and the individual&apos;s astrological chart. By mapping planetary influences to spatial zones, we create environments that resonate with each person&apos;s unique cosmic blueprint — facilitating smoother energy flow, enhancing positive outcomes, and mitigating adverse influences.
            </p>
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              — Classical Vedic synthesis: Jyotish Shastra × Vastu Shastra
            </p>
          </div>
        </div>
      )}

      {/* ══ PROPERTY SUMMARY (always visible) ═══════════════════ */}
      <section className="card-gold" style={{ padding: isMobile ? '1.5rem' : '2.5rem', borderRadius: 'var(--r-lg, 16px)', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '2rem', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.25rem', fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.4rem' : '1.9rem', fontWeight: 300 }}>Property Potential Report</h2>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Synthesized from Manasara · Mayamata · Brihat Samhita · Mahavastu</div>
          </div>
          <div className="badge badge-gold" style={{ padding: isMobile ? '6px 14px' : '10px 22px', fontSize: isMobile ? '0.88rem' : '1rem' }}>Overall Grade: {grade}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: isMobile ? '1.5rem' : '2.5rem' }}>
          {[
            { label: 'Primary Strength', color: 'var(--teal)', content: `The <strong>${bestZone.name}</strong> zone leads at ${bestZone.score}%, creating natural resonance for <strong>${bestZone.quality.split(',')[0].toLowerCase()}</strong>. Harness this Power Corridor actively.` },
            { label: 'Primary Weakness', color: 'var(--rose)', content: `The <strong>${worstZone.name}</strong> zone shows depletion at ${worstZone.score}%, potentially manifesting as challenges in <strong>${worstZone.quality.split(',')[0].toLowerCase()}</strong>. Priority remedy zone.` },
            { label: 'Key Recommendation', color: 'var(--text-gold)', content: `Activate the <strong>${bestEntrance.name}</strong> entrance and balance <strong>${ELEM_ICON[dominantElement]} ${dominantElement}</strong> element. Perform ${GRAHA_NAMES[worstZone.ruling as GrahaId]} Graha Shanti for maximum spatial alignment.` },
          ].map((item, idx) => (
            <div key={item.label} style={{ borderRight: isMobile || idx === 2 ? 'none' : '1px solid rgba(201,168,76,0.2)', paddingRight: isMobile || idx === 2 ? 0 : '2.5rem', borderBottom: isMobile && idx < 2 ? '1px solid rgba(201,168,76,0.1)' : 'none', paddingBottom: isMobile && idx < 2 ? '1.5rem' : 0 }}>
              <h4 style={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.12em', marginBottom: '0.75rem', color: item.color }}>{item.label}</h4>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 300, lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: item.content }} />
            </div>
          ))}
        </div>

        <div className="divider" style={{ margin: '2rem 0', opacity: 0.2 }} />
        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          Advanced Astro-Vāstu Engine · Sources: Manasara · Mayamata · Brihat Samhita · Vishwakarma Prakash · Samarangana Sutradhara · Mahavastu<br/>
          Align property compass with Magnetic North for accurate remedial deployment
        </p>
      </section>

      <div style={{ padding: '0.85rem 1.2rem', background: 'rgba(201,168,76,0.04)', borderRadius: 'var(--r-md)', border: '1px dashed var(--border-bright)', fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.55 }}>
        ℹ️ This analysis uses your natal planetary longitudes for directional correlation. For full Vastu Shanti, consult a qualified Vastu practitioner to physically survey the property with compass and floor plan. Digital analysis provides directional tendencies; on-site measurement gives exact door positions and marma locations.
      </div>
    </div>
  )
}
