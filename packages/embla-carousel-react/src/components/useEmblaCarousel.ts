import { useRef, useEffect, useState, useCallback } from 'react'
import { areOptionsEqual, arePluginsEqual } from 'embla-carousel-reactive-utils'
import EmblaCarousel, {
  EmblaCarouselType,
  EmblaOptionsType,
  EmblaPluginType
} from 'embla-carousel'

export type EmblaRootNodeRefType = <RootNode extends HTMLElement>(
  instance: RootNode | null
) => void

export type UseEmblaCarouselType = [
  EmblaRootNodeRefType,
  EmblaCarouselType | undefined,
  EmblaCarouselType
]

function useEmblaCarousel(
  options: EmblaOptionsType = {},
  plugins: EmblaPluginType[] = []
): UseEmblaCarouselType {
  EmblaCarousel.globalOptions = useEmblaCarousel.globalOptions

  const storedOptions = useRef(options)
  const storedPlugins = useRef(plugins)

  // IMPORTANT: never pass `plugins` into the SSR (null-root) instance.
  // Plugin objects are stateful singletons; SSR init sets Autoplay's `isSsr=true`
  // and leaves play()/stop() as permanent no-ops if that was the last init() —
  // which happens whenever this hook remounts and reuses the same plugin
  // instances from a parent useMemo (hero ImageCarousel, etc.).
  const serverApi = useRef(EmblaCarousel(null, options))
  const [clientApi, setClientApi] = useState<EmblaCarouselType>()
  const [rootNode, setRootNode] = useState<HTMLElement>()

  const reInit = useCallback(() => {
    if (!clientApi) return
    clientApi.reInit(storedOptions.current, storedPlugins.current)
  }, [clientApi])

  useEffect(() => {
    if (areOptionsEqual(storedOptions.current, options)) return
    storedOptions.current = options
    reInit()
  }, [options, reInit])

  useEffect(() => {
    if (arePluginsEqual(storedPlugins.current, plugins)) return
    storedPlugins.current = plugins
    reInit()
  }, [plugins, reInit])

  useEffect(() => {
    if (rootNode) {
      EmblaCarousel.globalOptions = useEmblaCarousel.globalOptions
      const newClientApi = EmblaCarousel(
        rootNode,
        storedOptions.current,
        storedPlugins.current
      )
      setClientApi(newClientApi)
      return () => newClientApi.destroy()
    } else {
      setClientApi(undefined)
    }
  }, [rootNode])

  return [<EmblaRootNodeRefType>setRootNode, clientApi, serverApi.current]
}

declare namespace useEmblaCarousel {
  let globalOptions: EmblaOptionsType | undefined
}

useEmblaCarousel.globalOptions = undefined

export default useEmblaCarousel
