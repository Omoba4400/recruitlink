import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { setUser, setLoading, setInitializing, updateEmailVerification } from '../store/slices/authSlice';
import { getUserProfile } from '../services/user.service';
import { User } from '../types/user';
import { doc, setDoc } from 'firebase/firestore';

const FirebaseInit = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    console.log('Setting up auth state observer in FirebaseInit');
    let isSubscribed = true;

    const initialize = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log('Firebase user authenticated:', currentUser.uid);
          
          // Get the user's profile from Firestore
          const userProfile = await getUserProfile(currentUser.uid);
          console.log('Fetched user profile:', userProfile);
          
          if (userProfile) {
            // If profile exists, update Redux state with clean data
            const userData: User = {
              id: currentUser.uid,
              uid: currentUser.uid,
              email: currentUser.email || '',
              emailVerified: currentUser.emailVerified,
              displayName: currentUser.displayName || userProfile.displayName || '',
              photoURL: currentUser.photoURL || userProfile.photoURL || '',
              userType: userProfile.userType,
              createdAt: userProfile.createdAt,
              updatedAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              bio: userProfile.bio || '',
              location: userProfile.location || '',
              verified: userProfile.verified || false,
              isAdmin: false,
              verificationStatus: userProfile.verificationStatus || 'none',
              privacySettings: userProfile.privacySettings || {
                profileVisibility: 'public',
                allowMessagesFrom: 'everyone',
                showEmail: true,
                showLocation: true,
                showAcademicInfo: true,
                showAthleteStats: true
              },
              socialLinks: userProfile.socialLinks || {
                instagram: '',
                twitter: '',
                linkedin: '',
                youtube: '',
              },
              followers: userProfile.followers || [],
              following: userProfile.following || [],
              connections: userProfile.connections || [],
              athleteInfo: userProfile.athleteInfo,
              coachInfo: userProfile.coachInfo,
              teamInfo: userProfile.teamInfo,
              sponsorInfo: userProfile.sponsorInfo,
              mediaInfo: userProfile.mediaInfo
            };

            if (isSubscribed) {
              console.log('Dispatching user data to Redux:', userData);
              dispatch(setUser(userData));
              dispatch(updateEmailVerification(currentUser.emailVerified));
            }
          } else {
            // If no profile exists, create one with basic Firebase user data
            const timestamp = new Date().toISOString();
            const newUser: User = {
              id: currentUser.uid,
              uid: currentUser.uid,
              email: currentUser.email || '',
              emailVerified: currentUser.emailVerified,
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              userType: 'athlete',
              createdAt: timestamp,
              updatedAt: timestamp,
              lastLogin: timestamp,
              bio: '',
              location: '',
              verified: false,
              isAdmin: false,
              verificationStatus: 'none',
              privacySettings: {
                profileVisibility: 'public',
                allowMessagesFrom: 'everyone',
                showEmail: true,
                showLocation: true,
                showAcademicInfo: true,
                showAthleteStats: true
              },
              socialLinks: {
                instagram: '',
                twitter: '',
                linkedin: '',
                youtube: '',
              },
              followers: [],
              following: [],
              connections: [],
              athleteInfo: {
                sports: [{
                  sport: '',
                  position: '',
                  level: '',
                  experience: 0,
                  specialties: [],
                  achievements: []
                }],
                academicInfo: {
                  currentSchool: '',
                  graduationYear: ''
                },
                verificationStatus: 'pending',
                media: [],
                memberships: [],
                interests: [],
                activities: [],
                awards: [],
                achievements: [],
                eligibility: {
                  isEligible: true
                },
                recruitingStatus: 'open'
              }
            };

            // Create the profile in Firestore
            await setDoc(doc(db, 'users', currentUser.uid), newUser);
            console.log('Created new user profile:', newUser);
            
            if (isSubscribed) {
              dispatch(setUser(newUser));
              dispatch(updateEmailVerification(currentUser.emailVerified));
            }
          }
        } else {
          console.log('No Firebase user - clearing Redux store');
          if (isSubscribed) {
            dispatch(setUser(null));
          }
        }
      } catch (error) {
        console.error('Error in initialization:', error);
        if (isSubscribed) {
          dispatch(setUser(null));
        }
      } finally {
        if (isSubscribed) {
          dispatch(setLoading(false));
          dispatch(setInitializing(false));
        }
      }
    };

    // Initialize immediately with current auth state
    initialize();

    // Set up auth state change listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isSubscribed) return;

      try {
        if (firebaseUser) {
          const userProfile = await getUserProfile(firebaseUser.uid);
          if (userProfile) {
            const userData: User = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              emailVerified: firebaseUser.emailVerified,
              displayName: firebaseUser.displayName || userProfile.displayName || '',
              photoURL: firebaseUser.photoURL || userProfile.photoURL || '',
              userType: userProfile.userType,
              createdAt: userProfile.createdAt,
              updatedAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              bio: userProfile.bio || '',
              location: userProfile.location || '',
              verified: userProfile.verified || false,
              isAdmin: false,
              verificationStatus: userProfile.verificationStatus || 'none',
              privacySettings: userProfile.privacySettings || {
                profileVisibility: 'public',
                allowMessagesFrom: 'everyone',
                showEmail: true,
                showLocation: true,
                showAcademicInfo: true,
                showAthleteStats: true
              },
              socialLinks: userProfile.socialLinks || {
                instagram: '',
                twitter: '',
                linkedin: '',
                youtube: '',
              },
              followers: userProfile.followers || [],
              following: userProfile.following || [],
              connections: userProfile.connections || [],
              athleteInfo: userProfile.athleteInfo,
              coachInfo: userProfile.coachInfo,
              teamInfo: userProfile.teamInfo,
              sponsorInfo: userProfile.sponsorInfo,
              mediaInfo: userProfile.mediaInfo
            };
            dispatch(setUser(userData));
            dispatch(updateEmailVerification(firebaseUser.emailVerified));
          }
        } else {
          dispatch(setUser(null));
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        dispatch(setUser(null));
      }
    });

    return () => {
      console.log('Cleaning up auth state observer');
      isSubscribed = false;
      unsubscribe();
    };
  }, [dispatch]);

  return null;
};

export default FirebaseInit; 