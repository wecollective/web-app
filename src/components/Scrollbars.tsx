import React, { useEffect, useRef } from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'

const Scrollbars = (props: {
    children: any
    className?: string
    onScrollBottom?: () => void
    onScrollTop?: () => void
    autoScrollToBottom?: boolean
    style?: any
}): JSX.Element => {
    const { children, className, onScrollBottom, onScrollTop, autoScrollToBottom, style } = props
    const ref = useRef<OverlayScrollbarsComponent>(null)
    const OSOptions = {
        className: 'os-theme-none',
        callbacks: {
            onScroll: () => {
                const instance = ref!.current!.osInstance()
                const scrollInfo = instance!.scroll()
                if (onScrollBottom && scrollInfo.ratio.y > 0.999) onScrollBottom()
                if (onScrollTop && scrollInfo.ratio.y < 0.001) onScrollTop()
            },
        },
    }

    useEffect(() => {
        if (autoScrollToBottom) {
            const instance = ref!.current!.osInstance()
            if (instance) instance.scroll([0, '100%'], 500)
        }
    }, [children.length])

    return (
        <OverlayScrollbarsComponent
            className={`${className} os-host-flexbox scrollbar-theme`}
            options={OSOptions}
            ref={ref}
            style={style}
        >
            {children}
        </OverlayScrollbarsComponent>
    )
}

Scrollbars.defaultProps = {
    className: null,
    onScrollBottom: null,
    onScrollTop: null,
    autoScrollToBottom: false,
    style: null,
}

export default Scrollbars
