'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  IconCamera,
  IconCheck,
  IconEdit,
  IconId,
  IconLoader2 as Loader2,
  IconMail,
  IconX,
  IconShieldLock,
  IconUser,
} from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import {
  baseProfileSettingsSchema,
  type BaseProfileSettingsInput,
} from '@/lib/validations/profile-settings.schema'
import type { AppRole } from '@/lib/auth/auth-context'

interface ProfileSettingsFormProps {
  role: AppRole | null
  profile: {
    id: number
    userId: string
    email: string
    givenName: string
    surname: string
    profilePicture: string | null
    coverPhoto: string | null
  }
}

interface UpdateProfileResponse {
  message?: string
  profile?: {
    userId: string
    email: string
    givenName: string
    surname: string
    profilePicture: string | null
    coverPhoto: string | null
  }
}

// getInitials - build avatar fallback initials
function getInitials(givenName: string, surname: string) {
  return `${givenName.charAt(0)}${surname.charAt(0)}`.toUpperCase()
}

// buildPreviewUrl - build a temporary preview url for selected files
function buildPreviewUrl(file: File | null, fallbackUrl: string | null) {
  if (!file) {
    return fallbackUrl
  }

  return URL.createObjectURL(file)
}

interface CropArea {
  x: number
  y: number
}

interface CropImageMeta {
  naturalWidth: number
  naturalHeight: number
  baseScale: number
}

const PROFILE_CROP_VIEWPORT_SIZE = 280

// clampValue - keep a numeric value inside a range
function clampValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

// getCropBounds - calculate draggable crop limits for a scaled image
function getCropBounds(imageWidth: number, imageHeight: number) {
  return {
    maxX: Math.max(0, (imageWidth - PROFILE_CROP_VIEWPORT_SIZE) / 2),
    maxY: Math.max(0, (imageHeight - PROFILE_CROP_VIEWPORT_SIZE) / 2),
  }
}

// clampCropArea - keep the crop position inside the visible image area
function clampCropArea(cropArea: CropArea, imageWidth: number, imageHeight: number) {
  const bounds = getCropBounds(imageWidth, imageHeight)

  return {
    x: clampValue(cropArea.x, -bounds.maxX, bounds.maxX),
    y: clampValue(cropArea.y, -bounds.maxY, bounds.maxY),
  }
}

// loadImage - load an image element from an object url
async function loadImage(sourceUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load the selected image.'))
    image.src = sourceUrl
  })
}

// createCroppedProfileFile - render the selected 1:1 crop into a new file
async function createCroppedProfileFile(
  sourceUrl: string,
  fileName: string,
  mimeType: string,
  cropArea: CropArea,
  renderedWidth: number,
  renderedHeight: number
) {
  const image = await loadImage(sourceUrl)
  const cropWidthInSource = (PROFILE_CROP_VIEWPORT_SIZE / renderedWidth) * image.naturalWidth
  const cropHeightInSource = (PROFILE_CROP_VIEWPORT_SIZE / renderedHeight) * image.naturalHeight
  const cropLeftInViewport = (renderedWidth - PROFILE_CROP_VIEWPORT_SIZE) / 2 - cropArea.x
  const cropTopInViewport = (renderedHeight - PROFILE_CROP_VIEWPORT_SIZE) / 2 - cropArea.y
  const sourceX = (cropLeftInViewport / renderedWidth) * image.naturalWidth
  const sourceY = (cropTopInViewport / renderedHeight) * image.naturalHeight
  const canvas = document.createElement('canvas')
  const safeSize = Math.max(1, Math.round(Math.min(cropWidthInSource, cropHeightInSource)))

  canvas.width = safeSize
  canvas.height = safeSize

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Failed to prepare the cropped profile image.')
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    cropWidthInSource,
    cropHeightInSource,
    0,
    0,
    safeSize,
    safeSize
  )

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((nextBlob) => resolve(nextBlob), mimeType || 'image/png')
  })

  if (!blob) {
    throw new Error('Failed to create the cropped profile image.')
  }

  return new File([blob], fileName, {
    type: blob.type || mimeType || 'image/png',
  })
}

// ProfileSettingsForm - render and submit the shared profile settings form
export function ProfileSettingsForm({ role, profile }: ProfileSettingsFormProps) {
  // ==================== HOOKS ====================
  const router = useRouter()
  const supabase = createClient()
  const profileInputRef = useRef<HTMLInputElement | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)
  const dragStateRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null)
  const [currentProfile, setCurrentProfile] = useState(profile)
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(currentProfile.profilePicture)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(currentProfile.coverPhoto)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [cropSourceFile, setCropSourceFile] = useState<File | null>(null)
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null)
  const [cropScale, setCropScale] = useState(1)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0 })
  const [cropRenderedSize, setCropRenderedSize] = useState({ width: PROFILE_CROP_VIEWPORT_SIZE, height: PROFILE_CROP_VIEWPORT_SIZE })
  const [cropImageMeta, setCropImageMeta] = useState<CropImageMeta | null>(null)
  const [isApplyingCrop, setIsApplyingCrop] = useState(false)
  const isAdmin = role === 'admin'

  const form = useForm<BaseProfileSettingsInput>({
    resolver: zodResolver(baseProfileSettingsSchema),
    defaultValues: {
      userId: profile.userId,
      givenName: profile.givenName,
      surname: profile.surname,
      email: profile.email,
      password: '',
      confirmPassword: '',
    },
  })

  // handleReset - restore the original form values and media previews
  const handleReset = () => {
    form.reset({
      userId: currentProfile.userId,
      givenName: currentProfile.givenName,
      surname: currentProfile.surname,
      email: currentProfile.email,
      password: '',
      confirmPassword: '',
    })
    setProfileFile(null)
    setCoverFile(null)
    setProfilePreviewUrl(currentProfile.profilePicture)
    setCoverPreviewUrl(currentProfile.coverPhoto)

    if (profileInputRef.current) {
      profileInputRef.current.value = ''
    }

    if (coverInputRef.current) {
      coverInputRef.current.value = ''
    }

    if (cropSourceUrl) {
      URL.revokeObjectURL(cropSourceUrl)
    }

    setCropDialogOpen(false)
    setCropSourceFile(null)
    setCropSourceUrl(null)
    setCropScale(1)
    setCropArea({ x: 0, y: 0 })
    setCropRenderedSize({
      width: PROFILE_CROP_VIEWPORT_SIZE,
      height: PROFILE_CROP_VIEWPORT_SIZE,
    })
    setCropImageMeta(null)
  }

  // syncProfilePreview - refresh the avatar preview when file selection changes
  useEffect(() => {
    const nextPreviewUrl = buildPreviewUrl(profileFile, currentProfile.profilePicture)
    setProfilePreviewUrl(nextPreviewUrl)

    return () => {
      if (profileFile && nextPreviewUrl) {
        URL.revokeObjectURL(nextPreviewUrl)
      }
    }
  }, [currentProfile.profilePicture, profileFile])

  // syncCoverPreview - refresh the cover preview when file selection changes
  useEffect(() => {
    const nextPreviewUrl = buildPreviewUrl(coverFile, currentProfile.coverPhoto)
    setCoverPreviewUrl(nextPreviewUrl)

    return () => {
      if (coverFile && nextPreviewUrl) {
        URL.revokeObjectURL(nextPreviewUrl)
      }
    }
  }, [coverFile, currentProfile.coverPhoto])

  // syncCurrentProfile - keep local profile state in sync with fresh server props
  useEffect(() => {
    setCurrentProfile(profile)
  }, [profile])

  // releaseCropSourceUrl - clean up temporary crop object urls
  useEffect(() => {
    return () => {
      if (cropSourceUrl) {
        URL.revokeObjectURL(cropSourceUrl)
      }
    }
  }, [cropSourceUrl])

  // handleFileSelect - store the selected image file in local state
  const handleFileSelect = (field: 'profile' | 'cover', event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null

    if (!selectedFile) {
      return
    }

    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      event.target.value = ''
      return
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      toast.error('Image size must be 2 MB or less.')
      event.target.value = ''
      return
    }

    if (field === 'profile') {
      if (cropSourceUrl) {
        URL.revokeObjectURL(cropSourceUrl)
      }

      const nextCropSourceUrl = URL.createObjectURL(selectedFile)

      setCropSourceFile(selectedFile)
      setCropSourceUrl(nextCropSourceUrl)
      setCropScale(1)
      setCropArea({ x: 0, y: 0 })
      setCropRenderedSize({
        width: PROFILE_CROP_VIEWPORT_SIZE,
        height: PROFILE_CROP_VIEWPORT_SIZE,
      })
      setCropImageMeta(null)
      setCropDialogOpen(true)
      return
    }

    setCoverFile(selectedFile)
  }

  // handleCropPointerDown - start dragging the profile image inside the crop frame
  const handleCropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!cropSourceUrl) {
      return
    }

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      initialX: cropArea.x,
      initialY: cropArea.y,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  // handleCropPointerMove - move the selected image inside the crop frame
  const handleCropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current) {
      return
    }

    const nextCropArea = clampCropArea(
      {
        x: dragStateRef.current.initialX + (event.clientX - dragStateRef.current.startX),
        y: dragStateRef.current.initialY + (event.clientY - dragStateRef.current.startY),
      },
      cropRenderedSize.width,
      cropRenderedSize.height
    )

    setCropArea(nextCropArea)
  }

  // handleCropPointerEnd - finish dragging the profile image
  const handleCropPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current) {
      dragStateRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  // handleCropDialogChange - close and reset crop state when the modal closes
  const handleCropDialogChange = (open: boolean) => {
    setCropDialogOpen(open)

    if (!open) {
      if (cropSourceUrl) {
        URL.revokeObjectURL(cropSourceUrl)
      }

      setCropSourceFile(null)
      setCropSourceUrl(null)
      setCropScale(1)
      setCropArea({ x: 0, y: 0 })
      setCropRenderedSize({
        width: PROFILE_CROP_VIEWPORT_SIZE,
        height: PROFILE_CROP_VIEWPORT_SIZE,
      })
      setCropImageMeta(null)

      if (profileInputRef.current) {
        profileInputRef.current.value = ''
      }
    }
  }

  // handleApplyCrop - turn the selected 1:1 crop into the next profile file
  const handleApplyCrop = async () => {
    if (!cropSourceFile || !cropSourceUrl) {
      return
    }

    try {
      setIsApplyingCrop(true)

      const croppedFile = await createCroppedProfileFile(
        cropSourceUrl,
        cropSourceFile.name,
        cropSourceFile.type,
        cropArea,
        cropRenderedSize.width,
        cropRenderedSize.height
      )

      setProfileFile(croppedFile)
      handleCropDialogChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to crop the image.')
    } finally {
      setIsApplyingCrop(false)
    }
  }

  // handleSubmit - send account updates and media uploads to the server
  const handleSubmit = async (values: BaseProfileSettingsInput) => {
    try {
      const formData = new FormData()
      formData.append('userId', values.userId)
      formData.append('givenName', values.givenName)
      formData.append('surname', values.surname)
      formData.append('email', values.email)

      if (values.password) {
        formData.append('password', values.password)
        formData.append('confirmPassword', values.confirmPassword || '')
      }

      if (profileFile) {
        formData.append('profilePicture', profileFile)
      }

      if (coverFile) {
        formData.append('coverPhoto', coverFile)
      }

      const response = await fetch('/api/profile/settings', {
        method: 'POST',
        body: formData,
      })
      const payload = (await response.json()) as UpdateProfileResponse

      if (!response.ok) {
        throw new Error(payload.message || 'Failed to update your profile settings.')
      }

      const nextProfile = payload.profile

      if (nextProfile) {
        setCurrentProfile((previousProfile) => ({
          ...previousProfile,
          ...nextProfile,
        }))
        form.reset({
          userId: nextProfile.userId,
          givenName: nextProfile.givenName,
          surname: nextProfile.surname,
          email: nextProfile.email,
          password: '',
          confirmPassword: '',
        })
        setProfilePreviewUrl(nextProfile.profilePicture)
        setCoverPreviewUrl(nextProfile.coverPhoto)
      } else {
        form.reset({
          ...values,
          password: '',
          confirmPassword: '',
        })
      }

      setProfileFile(null)
      setCoverFile(null)

      if (profileInputRef.current) {
        profileInputRef.current.value = ''
      }

      if (coverInputRef.current) {
        coverInputRef.current.value = ''
      }

      await supabase.auth.refreshSession()
      toast.success(payload.message || 'Profile settings updated successfully.')
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update your profile settings.'
      toast.error(message)
    }
  }

  // ==================== RENDER ====================
  return (
    <div className="w-full px-4 md:px-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Account Settings</h1>
          <p className="text-base text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Profile Media</CardTitle>
                <CardDescription className="text-sm">
                  Update your profile picture and cover photo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                <div className="space-y-3">
                  <div className="relative pt-1 pb-10 md:pb-11">
                    <label className="group block cursor-pointer">
                      <div className="h-48 overflow-hidden rounded-lg border bg-muted/30">
                        {coverPreviewUrl ? (
                          <img
                            src={coverPreviewUrl}
                            alt="Cover preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-muted/50 text-sm text-muted-foreground">
                            No cover photo selected
                          </div>
                        )}
                      </div>
                      <div className="pointer-events-none absolute inset-0 top-1 flex h-48 items-center justify-center rounded-lg bg-background/0 opacity-0 transition-all group-hover:bg-background/60 group-hover:opacity-100">
                        <div className="flex items-center gap-2 rounded-md bg-card/80 px-3 py-2 text-sm">
                          <IconEdit size={18} />
                          Edit cover photo
                        </div>
                      </div>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(event) => handleFileSelect('cover', event)}
                      />
                    </label>

                    <label className="group absolute left-1/2 top-48 z-10 block w-fit -translate-x-1/2 -translate-y-1/2 shrink-0 cursor-pointer md:left-4 md:translate-x-0">
                      <div className="rounded-full border-4 border-border bg-background shadow-lg">
                        <Avatar className="h-24 w-24 rounded-full">
                          <AvatarImage
                            src={profilePreviewUrl || undefined}
                            alt="Profile picture"
                            className="object-cover"
                          />
                          <AvatarFallback className="text-base font-semibold">
                            {getInitials(profile.givenName, profile.surname)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-background/0 opacity-0 transition-all group-hover:bg-background/60 group-hover:opacity-100">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card/80">
                          <IconCamera size={18} />
                        </div>
                      </div>
                      <input
                        ref={profileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(event) => handleFileSelect('profile', event)}
                      />
                    </label>
                  </div>

                  <div className="min-w-0 space-y-1 pt-6 md:pt-1">
                    <div className="flex flex-col items-center gap-2 md:items-start">
                      <div className="flex flex-col items-center gap-2 md:flex-row md:flex-wrap md:items-center md:justify-start">
                        <p className="order-2 text-sm font-semibold md:order-1">
                          {form.watch('givenName')} {form.watch('surname')}
                        </p>
                        <Badge
                          variant="outline"
                          className="order-1 rounded-md px-2 py-0 text-xs md:order-2"
                        >
                          {form.watch('userId')}
                        </Badge>
                      </div>
                      <p className="break-words text-center text-sm text-muted-foreground md:text-left">
                        {form.watch('email')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Personal Information</CardTitle>
                <CardDescription className="text-sm">
                  Update the account details shown on your profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="givenName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <IconUser size={18} />
                          {isAdmin ? 'Given Name' : 'First Name'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isAdmin || form.formState.isSubmitting}
                            placeholder="Enter your first name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="surname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <IconUser size={18} />
                          Last Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isAdmin || form.formState.isSubmitting}
                            placeholder="Enter your last name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <IconMail size={18} />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          disabled={form.formState.isSubmitting}
                          placeholder="Enter your email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <IconId size={18} />
                        User ID
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isAdmin || form.formState.isSubmitting}
                          placeholder="Enter your user ID"
                        />
                      </FormControl>
                      {!isAdmin ? (
                        <p className="text-xs text-muted-foreground">
                          Your user ID is managed by the administrator.
                        </p>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Change Password</CardTitle>
                <CardDescription className="text-sm">
                  Leave these fields blank if you do not want to change your password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <IconShieldLock size={18} />
                        New Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          disabled={form.formState.isSubmitting}
                          placeholder="Enter new password only if you want to change it"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <IconShieldLock size={18} />
                        Confirm New Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          disabled={form.formState.isSubmitting}
                          placeholder="Confirm your new password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={form.formState.isSubmitting}
                onClick={handleReset}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <Dialog open={cropDialogOpen} onOpenChange={handleCropDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
            <DialogDescription>
              Reposition your image inside the fixed square crop before applying it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className="relative mx-auto h-[280px] w-[280px] touch-none overflow-hidden rounded-lg border bg-muted cursor-grab active:cursor-grabbing"
              onPointerDown={handleCropPointerDown}
              onPointerMove={handleCropPointerMove}
              onPointerUp={handleCropPointerEnd}
              onPointerLeave={handleCropPointerEnd}
              onPointerCancel={handleCropPointerEnd}
            >
              {cropSourceUrl ? (
                <img
                  src={cropSourceUrl}
                  alt="Crop preview"
                  className="absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: `${cropRenderedSize.width}px`,
                    height: `${cropRenderedSize.height}px`,
                    transform: `translate(calc(-50% + ${cropArea.x}px), calc(-50% + ${cropArea.y}px))`,
                  }}
                  draggable={false}
                  onLoad={(event) => {
                    const image = event.currentTarget
                    const baseScale = Math.max(
                      PROFILE_CROP_VIEWPORT_SIZE / image.naturalWidth,
                      PROFILE_CROP_VIEWPORT_SIZE / image.naturalHeight
                    )
                    const nextWidth = image.naturalWidth * baseScale
                    const nextHeight = image.naturalHeight * baseScale

                    setCropImageMeta({
                      naturalWidth: image.naturalWidth,
                      naturalHeight: image.naturalHeight,
                      baseScale,
                    })
                    setCropScale(1)
                    setCropRenderedSize({
                      width: nextWidth,
                      height: nextHeight,
                    })
                    setCropArea((currentCropArea) => clampCropArea(currentCropArea, nextWidth, nextHeight))
                  }}
                />
              ) : null}
              <div className="pointer-events-none absolute inset-0 border border-white/30" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Zoom</span>
                <span>{cropScale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={cropScale}
                onChange={(event) => {
                  if (!cropImageMeta) {
                    return
                  }

                  const nextScale = Number(event.target.value)
                  const nextWidth = cropImageMeta.naturalWidth * cropImageMeta.baseScale * nextScale
                  const nextHeight = cropImageMeta.naturalHeight * cropImageMeta.baseScale * nextScale

                  setCropScale(nextScale)
                  setCropRenderedSize({
                    width: nextWidth,
                    height: nextHeight,
                  })
                  setCropArea((currentCropArea) =>
                    clampCropArea(currentCropArea, nextWidth, nextHeight)
                  )
                }}
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleCropDialogChange(false)} disabled={isApplyingCrop}>
              <IconX size={18} />
              Cancel
            </Button>
            <Button type="button" onClick={handleApplyCrop} disabled={isApplyingCrop || !cropSourceUrl}>
              {isApplyingCrop ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <IconCheck size={18} />
                  Apply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
