import React from 'react'

import { Composition, type CalculateMetadataFunction } from 'remotion'

import { mergeReelPropsFromRaw } from '../src/lib/reel/reel-remotion-presets'

import { VedaReel } from './VedaReel'

import { reelPropsSchema, type ReelProps } from './reel-schema'



const DEFAULT_IMAGES = [

  'https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&w=1080&q=80',

  'https://images.unsplash.com/photo-1493244040629-496f6d136cc3?auto=format&fit=crop&w=1080&q=80',

  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1080&q=80',

]



const defaultSeconds = 2.5

const fps = 30



const defaultProps = {

  images: DEFAULT_IMAGES,

  secondsPerImage: defaultSeconds,

  preset: 'vedaDefault' as const,

  objectFit: 'contain' as const,

}



export const calculateMetadata: CalculateMetadataFunction<ReelProps> = ({ props }) => {

  const parsed = reelPropsSchema.safeParse(props)

  const safe = parsed.success

    ? parsed.data

    : mergeReelPropsFromRaw({

        images: DEFAULT_IMAGES,

        secondsPerImage: defaultSeconds,

        preset: 'vedaDefault',

        objectFit: 'contain',

      })

  const totalSeconds = safe.images.reduce((sum, _, index) => {

    return sum + (safe.imageDurations?.[index] ?? safe.secondsPerImage)

  }, 0)



  return {

    durationInFrames: Math.max(1, Math.ceil(totalSeconds * fps)),

    fps,

    width: 1080,

    height: 1920,

  }

}



export function RemotionRoot() {

  return (

    <>

      <Composition

        id="ImageReel"

        component={VedaReel}

        defaultProps={defaultProps}

        calculateMetadata={calculateMetadata}

        schema={reelPropsSchema}

      />

    </>

  )

}

