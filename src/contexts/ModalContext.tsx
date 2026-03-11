/*
  WHY THIS FILE EXISTS — AND WHY IT'S A CONTEXT (NOT ZUSTAND):

  The modal state tracks which movie or TV show is currently open in the
  detail overlay. Two questions determine the right state layer:

  1. Does it need to persist across page refreshes?
     NO — you never want the modal to re-open on refresh.
     → Rules out Zustand with persist middleware.

  2. Does it need to be shared across distant components?
     YES — HeroBanner and TitleCard (nested inside MovieRow) both open the
     same modal, but they're not in a parent-child relationship.
     → Rules out local useState + prop drilling.

  React Context is the correct answer: scoped, reactive, ephemeral shared
  state within the component tree.

  USAGE:
    // Wrap the subtree that needs modal access:
    <ModalProvider> ... </ModalProvider>

    // In any child component:
    const { activeTitle, openModal, closeModal } = useModal()
*/

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Movie } from '../types/movie'
import type { TVShow } from '../types/tv'

// A "title" is any item that can be shown in the detail modal
export type ModalTitle = Movie | TVShow

interface ModalContextValue {
  /** The title currently displayed in the modal, or null if closed */
  activeTitle: ModalTitle | null
  /** Open the modal for a specific title */
  openModal: (title: ModalTitle) => void
  /** Close the modal */
  closeModal: () => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

interface ModalProviderProps {
  children: ReactNode
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [activeTitle, setActiveTitle] = useState<ModalTitle | null>(null)

  const openModal = (title: ModalTitle) => setActiveTitle(title)
  const closeModal = () => setActiveTitle(null)

  return (
    <ModalContext.Provider value={{ activeTitle, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  )
}

/**
 * Hook to access the modal context.
 * Throws if used outside of ModalProvider — this is intentional.
 * A missing provider is a programming error, not a runtime condition.
 */
export function useModal(): ModalContextValue {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}
