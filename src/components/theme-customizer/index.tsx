"use client"

import React from 'react'
import {
  IconLayout,
  IconPalette,
  IconRefresh,
  IconSettings,
  IconX,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useThemeManager } from '@/hooks/use-theme-manager'
import { useIsMobile } from '@/hooks/use-mobile'
import { useSidebarConfig } from '@/contexts/sidebar-context'
import { tweakcnThemes } from '@/config/theme-data'
import { ThemeTab } from './theme-tab'
import { LayoutTab } from './layout-tab'
import { ImportModal } from './import-modal'
import { cn } from '@/lib/utils'
import type { ImportedTheme } from '@/types/theme-customizer'

interface ThemeCustomizerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ThemeCustomizer({ open, onOpenChange }: ThemeCustomizerProps) {
  const { applyImportedTheme, isDarkMode, resetTheme, applyRadius, setBrandColorsValues, applyTheme, applyTweakcnTheme } = useThemeManager()
  const { config: sidebarConfig, updateConfig: updateSidebarConfig } = useSidebarConfig()
  const isMobile = useIsMobile()

  const [activeTab, setActiveTab] = React.useState("theme")
  const [selectedTheme, setSelectedTheme] = React.useState("default")
  const [selectedTweakcnTheme, setSelectedTweakcnTheme] = React.useState("")
  const [selectedRadius, setSelectedRadius] = React.useState("0.5rem")
  const [importModalOpen, setImportModalOpen] = React.useState(false)
  const [importedTheme, setImportedTheme] = React.useState<ImportedTheme | null>(null)

  const handleReset = () => {
    // Complete reset to application defaults

    // 1. Reset all state variables to initial values
    setSelectedTheme("default")
    setSelectedTweakcnTheme("")
    setSelectedRadius("0.5rem")
    setImportedTheme(null) // Clear imported theme
    setBrandColorsValues({}) // Clear brand colors state

    // 2. Completely remove all custom CSS variables
    resetTheme()

    // 3. Reset the radius to default
    applyRadius("0.5rem")

    // 4. Reset sidebar to defaults
    updateSidebarConfig({ variant: "inset", collapsible: "offcanvas", side: "left" })
  }

  const handleImport = (themeData: ImportedTheme) => {
    setImportedTheme(themeData)
    // Clear other selections to indicate custom import is active
    setSelectedTheme("")
    setSelectedTweakcnTheme("")

    // Apply the imported theme
    applyImportedTheme(themeData, isDarkMode)
  }

  const handleImportClick = () => {
    setImportModalOpen(true)
  }

  // Re-apply themes when theme mode changes
  React.useEffect(() => {
    if (importedTheme) {
      applyImportedTheme(importedTheme, isDarkMode)
    } else if (selectedTheme) {
      applyTheme(selectedTheme, isDarkMode)
    } else if (selectedTweakcnTheme) {
      const selectedPreset = tweakcnThemes.find(t => t.value === selectedTweakcnTheme)?.preset
      if (selectedPreset) {
        applyTweakcnTheme(selectedPreset, isDarkMode)
      }
    }
  }, [isDarkMode, importedTheme, selectedTheme, selectedTweakcnTheme, applyImportedTheme, applyTheme, applyTweakcnTheme])

  // renderCustomizerContent - reuse the same theme customizer content for sheet and drawer
  function renderCustomizerContent(isDrawer: boolean) {
    return (
      <>
        {isDrawer ? (
          <DrawerHeader className="space-y-0 px-4 pb-2 text-left">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <IconSettings className="h-4 w-4" />
              </div>
              <DrawerTitle className="text-lg font-semibold">Customizer</DrawerTitle>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleReset} className="h-8 w-8 cursor-pointer">
                  <IconRefresh className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 cursor-pointer">
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <DrawerDescription className="sr-only">
              Customize the theme and layout of your dashboard.
            </DrawerDescription>
          </DrawerHeader>
        ) : (
          <SheetHeader className="space-y-0 p-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <IconSettings className="h-4 w-4" />
              </div>
              <SheetTitle className="text-lg font-semibold">Customizer</SheetTitle>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleReset} className="h-8 w-8 cursor-pointer">
                  <IconRefresh className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 cursor-pointer">
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <SheetDescription className="sr-only">
              Customize the theme and layout of your dashboard.
            </SheetDescription>
          </SheetHeader>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full min-h-0 flex-col">
            <div className="py-2">
              <TabsList className="grid h-12 w-full grid-cols-2 rounded-none p-1.5">
                <TabsTrigger value="theme" className="cursor-pointer data-[state=active]:bg-background">
                  <IconPalette className="mr-1 h-4 w-4" /> Theme
                </TabsTrigger>
                <TabsTrigger value="layout" className="cursor-pointer data-[state=active]:bg-background">
                  <IconLayout className="mr-1 h-4 w-4" /> Layout
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="theme" className="mt-0 min-h-0 flex-1">
              <ThemeTab
                selectedTheme={selectedTheme}
                setSelectedTheme={setSelectedTheme}
                selectedTweakcnTheme={selectedTweakcnTheme}
                setSelectedTweakcnTheme={setSelectedTweakcnTheme}
                selectedRadius={selectedRadius}
                setSelectedRadius={setSelectedRadius}
                setImportedTheme={setImportedTheme}
                onImportClick={handleImportClick}
              />
            </TabsContent>

            <TabsContent value="layout" className="mt-0 min-h-0 flex-1">
              <LayoutTab />
            </TabsContent>
          </Tabs>
        </div>
      </>
    )
  }

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange} modal={false} direction="bottom">
          <DrawerContent
            className="pointer-events-auto flex max-h-[85vh] min-h-0 flex-col overflow-hidden p-0"
            onInteractOutside={(e) => {
              if (importModalOpen) {
                e.preventDefault()
              }
            }}
          >
            {renderCustomizerContent(true)}
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
          <SheetContent
            side={sidebarConfig.side === "left" ? "right" : "left"}
            className="pointer-events-auto flex w-[400px] flex-col gap-0 overflow-hidden p-0 [&>button]:hidden"
            onInteractOutside={(e) => {
              if (importModalOpen) {
                e.preventDefault()
              }
            }}
          >
            {renderCustomizerContent(false)}
          </SheetContent>
        </Sheet>
      )}

      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImport={handleImport}
      />
    </>
  )
}

// Floating trigger button - positioned dynamically based on sidebar side
export function ThemeCustomizerTrigger({ onClick }: { onClick: () => void }) {
  const isMobile = useIsMobile()
  const triggerSize = 48
  const edgeOffset = 16
  const mobileLongPressMs = 300
  const [position, setPosition] = React.useState<{ x: number; y: number } | null>(null)
  const [isDragActive, setIsDragActive] = React.useState(false)
  const dragOffsetRef = React.useRef({ x: 0, y: 0 })
  const pointerStartRef = React.useRef({ x: 0, y: 0 })
  const isDraggingRef = React.useRef(false)
  const hasMovedRef = React.useRef(false)
  const suppressClickRef = React.useRef(false)
  const longPressTimerRef = React.useRef<number | null>(null)

  // clampPosition - keep the floating trigger inside the viewport
  function clampPosition(x: number, y: number) {
    if (typeof window === 'undefined') {
      return { x, y }
    }

    return {
      x: Math.min(Math.max(edgeOffset, x), window.innerWidth - triggerSize - edgeOffset),
      y: Math.min(Math.max(edgeOffset, y), window.innerHeight - triggerSize - edgeOffset),
    }
  }

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setPosition({
      x: window.innerWidth - triggerSize - edgeOffset,
      y: window.innerHeight - triggerSize - edgeOffset,
    })
  }, [])

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleResize = () => {
      setPosition((currentPosition) => {
        if (!currentPosition) {
          return {
            x: window.innerWidth - triggerSize - edgeOffset,
            y: window.innerHeight - triggerSize - edgeOffset,
          }
        }

        return clampPosition(currentPosition.x, currentPosition.y)
      })
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  React.useEffect(() => {
    return () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current)
      }
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }
  }, [])

  // clearLongPressTimer - stop waiting for mobile drag activation
  function clearLongPressTimer() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  // handlePointerMove - drag the trigger across the viewport
  const handlePointerMove = React.useCallback((event: PointerEvent) => {
    const deltaX = event.clientX - pointerStartRef.current.x
    const deltaY = event.clientY - pointerStartRef.current.y

    if (!isDraggingRef.current) {
      if (isMobile && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
        clearLongPressTimer()
        document.removeEventListener('pointermove', handlePointerMove)
        document.removeEventListener('pointerup', handlePointerUp)
      }

      return
    }

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      hasMovedRef.current = true
    }

    event.preventDefault()
    const nextX = event.clientX - dragOffsetRef.current.x
    const nextY = event.clientY - dragOffsetRef.current.y
    setPosition(clampPosition(nextX, nextY))
  }, [isMobile])

  // handlePointerUp - stop dragging the trigger
  const handlePointerUp = React.useCallback(() => {
    clearLongPressTimer()

    if (hasMovedRef.current) {
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 0)
    }

    isDraggingRef.current = false
    setIsDragActive(false)
    document.removeEventListener('pointermove', handlePointerMove)
    document.removeEventListener('pointerup', handlePointerUp)
  }, [handlePointerMove])

  // handlePointerDown - start dragging from the current pointer position
  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    }
    hasMovedRef.current = false

    if (isMobile) {
      clearLongPressTimer()
      longPressTimerRef.current = window.setTimeout(() => {
        isDraggingRef.current = true
        setIsDragActive(true)
        suppressClickRef.current = true
      }, mobileLongPressMs)
    } else {
      isDraggingRef.current = true
      setIsDragActive(true)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
  }

  // handleClick - avoid opening the customizer when the button was dragged
  const handleClick = () => {
    if (isDraggingRef.current || hasMovedRef.current || suppressClickRef.current) {
      hasMovedRef.current = false
      return
    }

    onClick()
  }

  return (
    <Button
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      size="icon"
      className={cn(
        "fixed z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90",
        isDragActive ? "cursor-grabbing" : isMobile ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
      )}
      style={{
        ...(!isMobile && position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
            }
          : {
              right: `${edgeOffset}px`,
              bottom: `${edgeOffset}px`,
            }),
        touchAction: isDragActive ? 'none' : 'manipulation',
      }}
    >
      <IconSettings className="h-5 w-5" />
    </Button>
  )
}
