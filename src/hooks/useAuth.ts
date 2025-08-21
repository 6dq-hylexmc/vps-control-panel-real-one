import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useToast } from '@/hooks/use-toast'

export interface UserProfile {
  id: string
  username: string
  role: 'admin' | 'user'
  created_at: string
  updated_at: string
  is_active: boolean
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Get user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUserProfile(data)
      return data
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
      return null
    }
  }

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        setUser(data.user)
        await fetchUserProfile(data.user.id)
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        })
      }

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in'
      setError(message)
      toast({
        title: "Sign In Failed",
        description: message,
        variant: "destructive",
      })
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Sign up new user
  const signUp = async (email: string, password: string, username: string, role: 'admin' | 'user' = 'user') => {
    try {
      setLoading(true)
      setError(null)

      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single()

      if (existingUser) {
        throw new Error('Username is already taken')
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            role
          }
        }
      })

      if (error) throw error

      toast({
        title: "Account Created",
        description: "Your account has been created successfully.",
      })

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account'
      setError(message)
      toast({
        title: "Sign Up Failed",
        description: message,
        variant: "destructive",
      })
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setUserProfile(null)
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out'
      toast({
        title: "Sign Out Failed",
        description: message,
        variant: "destructive",
      })
    }
  }

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setUserProfile(data)
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      toast({
        title: "Update Failed",
        description: message,
        variant: "destructive",
      })
      throw err
    }
  }

  // Change password
  const changePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password'
      toast({
        title: "Password Change Failed",
        description: message,
        variant: "destructive",
      })
      throw err
    }
  }

  // Get all users (admin only)
  const getAllUsers = async () => {
    try {
      if (!userProfile || userProfile.role !== 'admin') {
        throw new Error('Insufficient permissions')
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users'
      throw new Error(message)
    }
  }

  // Create user (admin only)
  const createUser = async (email: string, password: string, username: string, role: 'admin' | 'user' = 'user') => {
    try {
      if (!userProfile || userProfile.role !== 'admin') {
        throw new Error('Insufficient permissions')
      }

      return await signUp(email, password, username, role)
    } catch (err) {
      throw err
    }
  }

  // Delete user (admin only)
  const deleteUser = async (userId: string) => {
    try {
      if (!userProfile || userProfile.role !== 'admin') {
        throw new Error('Insufficient permissions')
      }

      // Delete from auth.users (this will cascade to public.users)
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error

      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user'
      toast({
        title: "Delete Failed",
        description: message,
        variant: "destructive",
      })
      throw err
    }
  }

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    userProfile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    changePassword,
    getAllUsers,
    createUser,
    deleteUser,
    isAdmin: userProfile?.role === 'admin',
    isAuthenticated: !!user
  }
}