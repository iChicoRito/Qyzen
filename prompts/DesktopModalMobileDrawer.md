Objective #1: Desktop Modal Dialog Background Blurs

    Path Related to this objective:
    - src\app\(educator)\educator\assessment
    - src\app\(educator)\educator\classroom
    - src\app\(educator)\educator\dashboard
    - src\app\(educator)\educator\enrollment
    - src\app\(educator)\educator\group-chats
    - src\app\(educator)\educator\realtime-monitoring
    - src\app\(educator)\educator\scores

    1). In all the paths mentioned and inside that paths, I wanted that every modals (add, edit, view, delete) the modal background should be blur for better UX and focus on that modal.

    2). The modal backdrop shouldn't have any color, it's just a blur only.

Objective #2: Mobile Modal Dialog to Responsive Drawer

    Path Related to this objective: 
    - src\app\(educator)\educator\assessment
    - src\app\(educator)\educator\classroom
    - src\app\(educator)\educator\dashboard
    - src\app\(educator)\educator\enrollment
    - src\app\(educator)\educator\group-chats
    - src\app\(educator)\educator\realtime-monitoring
    - src\app\(educator)\educator\scores

    1). In the same paths, every modal dialogs will be replaced into drawer. This drawer is only applicable if the device is mobile devices/view. Ensure the responsiveness of the drawer. If the modal has many content make it responsive scrollable drawer.

    2). I want the drawer will be consistent for all drawers.

    3). Use the default shadcn drawer style. For the scrollable content, follow this as reference:

        "use client"

        import * as React from "react"

        import { cn } from "@/lib/utils"
        import { useMediaQuery } from "@/hooks/use-media-query"
        import { Button } from "@/components/ui/button"
        import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
        } from "@/components/ui/dialog"
        import {
        Drawer,
        DrawerClose,
        DrawerContent,
        DrawerDescription,
        DrawerFooter,
        DrawerHeader,
        DrawerTitle,
        DrawerTrigger,
        } from "@/components/ui/drawer"
        import { Input } from "@/components/ui/input"
        import { Label } from "@/components/ui/label"

        export function DrawerDialogDemo() {
        const [open, setOpen] = React.useState(false)
        const isDesktop = useMediaQuery("(min-width: 768px)")

        if (isDesktop) {
            return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                <Button variant="outline">Edit Profile</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit profile</DialogTitle>
                    <DialogDescription>
                    Make changes to your profile here. Click save when you&apos;re
                    done.
                    </DialogDescription>
                </DialogHeader>
                <ProfileForm />
                </DialogContent>
            </Dialog>
            )
        }

        return (
            <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button variant="outline">Edit Profile</Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader className="text-left">
                <DrawerTitle>Edit profile</DrawerTitle>
                <DrawerDescription>
                    Make changes to your profile here. Click save when you&apos;re done.
                </DrawerDescription>
                </DrawerHeader>
                <ProfileForm className="px-4" />
                <DrawerFooter className="pt-2">
                <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
            </Drawer>
        )
        }

        function ProfileForm({ className }: React.ComponentProps<"form">) {
        return (
            <form className={cn("grid items-start gap-6", className)}>
            <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input type="email" id="email" defaultValue="shadcn@example.com" />
            </div>
            <div className="grid gap-3">
                <Label htmlFor="username">Username</Label>
                <Input id="username" defaultValue="@shadcn" />
            </div>
            <Button type="submit">Save changes</Button>
            </form>
        )
    }

    This code is from the official shadcn components:

        Responsive Dialog

        You can combine the Dialog and Drawer components to create a responsive dialog. This renders a Dialog component on desktop and a Drawer on mobile.


    4). The delete confirmation across the pages should stay as modal, the only affected modal that needs to be drawer is the add, edit and view modals only.

Note: My current modal there is card style, now I don't want that anymore, I just want to use the default dialog modal for all (ADD, VIEW, EDIT, DOWNLOAD, ETC)