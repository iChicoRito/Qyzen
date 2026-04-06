"use client"

import * as React from "react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer"

interface ResponsiveDialogContextValue {
  isMobile: boolean
}

const ResponsiveDialogContext = React.createContext<ResponsiveDialogContextValue>({
  isMobile: false,
})

// useResponsiveDialogContext - read the current responsive dialog mode
function useResponsiveDialogContext() {
  return React.useContext(ResponsiveDialogContext)
}

// ResponsiveDialog - switch between dialog and drawer by breakpoint
function ResponsiveDialog({
  children,
  ...props
}: React.ComponentProps<typeof Dialog>) {
  const isMobile = useIsMobile()

  return (
    <ResponsiveDialogContext.Provider value={{ isMobile }}>
      {isMobile ? <Drawer {...props}>{children}</Drawer> : <Dialog {...props}>{children}</Dialog>}
    </ResponsiveDialogContext.Provider>
  )
}

// ResponsiveDialogTrigger - render the matching trigger primitive
function ResponsiveDialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogTrigger>) {
  const { isMobile } = useResponsiveDialogContext()

  if (isMobile) {
    return <DrawerTrigger {...props} />
  }

  return <DialogTrigger {...props} />
}

type ResponsiveDialogContentProps = Omit<
  React.ComponentProps<typeof DialogContent>,
  "overlayClassName"
> & {
  desktopClassName?: string
  mobileClassName?: string
  overlayClassName?: string
}

// ResponsiveDialogContent - render desktop dialog content or mobile drawer content
function ResponsiveDialogContent({
  className,
  desktopClassName,
  mobileClassName,
  overlayClassName,
  showCloseButton = true,
  children,
  ...props
}: ResponsiveDialogContentProps) {
  const { isMobile } = useResponsiveDialogContext()

  if (isMobile) {
    return (
      <DrawerContent
        className={cn(
          "max-h-[85vh] overflow-hidden [&>form]:flex [&>form]:min-h-0 [&>form]:flex-1 [&>form]:flex-col",
          className,
          mobileClassName
        )}
        {...props}
      >
        {children}
      </DrawerContent>
    )
  }

  return (
    <DialogContent
      showCloseButton={showCloseButton}
      overlayClassName={cn("bg-transparent backdrop-blur-sm", overlayClassName)}
      className={cn(
        "max-h-[90vh] overflow-hidden [&>form]:flex [&>form]:min-h-0 [&>form]:flex-1 [&>form]:flex-col",
        className,
        desktopClassName
      )}
      {...props}
    >
      {children}
    </DialogContent>
  )
}

// ResponsiveDialogHeader - render the matching header primitive
function ResponsiveDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile } = useResponsiveDialogContext()

  if (isMobile) {
    return <DrawerHeader className={cn("px-4 text-left", className)} {...props} />
  }

  return <DialogHeader className={cn("px-6 pt-6 pb-4 text-left", className)} {...props} />
}

// ResponsiveDialogTitle - render the matching title primitive
function ResponsiveDialogTitle({
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  const { isMobile } = useResponsiveDialogContext()

  if (isMobile) {
    return <DrawerTitle {...props} />
  }

  return <DialogTitle {...props} />
}

// ResponsiveDialogDescription - render the matching description primitive
function ResponsiveDialogDescription({
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const { isMobile } = useResponsiveDialogContext()

  if (isMobile) {
    return <DrawerDescription {...props} />
  }

  return <DialogDescription {...props} />
}

// ResponsiveDialogBody - standard scrollable body container
function ResponsiveDialogBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-8 md:px-6", className)} {...props} />
}

// ResponsiveDialogFooter - render the matching footer primitive
function ResponsiveDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile } = useResponsiveDialogContext()

  if (isMobile) {
    return (
      <DrawerFooter
        className={cn(
          "mt-auto shrink-0 border-t bg-background px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-1px_0_0_hsl(var(--border))]",
          className
        )}
        {...props}
      />
    )
  }

  return <DialogFooter className={cn("mt-auto shrink-0 border-t bg-background px-6 py-4", className)} {...props} />
}

// ResponsiveDialogClose - render the matching close primitive
function ResponsiveDialogClose({
  ...props
}: React.ComponentProps<typeof DialogClose>) {
  const { isMobile } = useResponsiveDialogContext()

  if (isMobile) {
    return <DrawerClose {...props} />
  }

  return <DialogClose {...props} />
}

export {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
}
