import * as React from 'react'
import {
  PlasmicComponent,
  ComponentRenderData,
  PlasmicRootProvider,
  initPlasmicLoader,
} from '@plasmicapp/loader-nextjs'
import { GetStaticPaths, GetStaticProps } from 'next'
import Error from 'next/error'
import { PLASMIC } from '../plasmic-init'

/**
 * Use fetchPages() to fetch list of pages that have been created in Plasmic
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const pages = await PLASMIC.fetchPages()
  return {
    paths: pages.map((page) => ({
      params: { catchall: page.path.substring(1).split('/') },
    })),
    fallback: false,
  }
}

/**
 * For each page, pre-fetch the data we need to render it
 */
export const getStaticProps: GetStaticProps = async (context) => {
  const { catchall } = context.params ?? {}

  // Convert the catchall param into a path string
  const plasmicPath =
    typeof catchall === 'string'
      ? catchall
      : Array.isArray(catchall)
      ? `/${catchall.join('/')}`
      : '/'
  const plasmicData = await PLASMIC.maybeFetchComponentData(plasmicPath)
  if (plasmicData) {
    // This is a path that Plasmic knows about; pass the data
    // in as props
    return {
      props: { plasmicData },
    }
  } else {
    // This is some non-Plasmic catch-all page
    return {
      props: {},
    }
  }
}

/**
 * Actually render the page!
 */
export default function CatchallPage(props: {
  plasmicData?: ComponentRenderData
}) {
  const { plasmicData } = props
  if (!plasmicData || plasmicData.entryCompMetas.length === 0) {
    return <Error statusCode={404} />
  }
  return (
    // Pass in the data fetched in getStaticProps as prefetchedData
    <PlasmicRootProvider loader={PLASMIC} prefetchedData={plasmicData}>
      {
        // plasmicData.entryCompMetas[0].name contains the name
        // of the component you fetched.
      }
      <PlasmicComponent component={plasmicData.entryCompMetas[0].name} />
    </PlasmicRootProvider>
  )
}
