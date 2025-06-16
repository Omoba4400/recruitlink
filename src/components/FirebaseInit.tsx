import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { setUser, setLoading, setInitializing, updateEmailVerification } from '../store/slices/authSlice';
import { getUserProfile } from '../services/user.service';
import { User, UserProfile } from '../types/user';
import { doc, setDoc } from 'firebase/firestore';

const FirebaseInit = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    console.log('FirebaseInit - Setting up auth state observer');
    let isSubscribed = true;

    // Set initializing to true when component mounts
    dispatch(setInitializing(true));
    dispatch(setLoading(true));

    const initialize = async () => {
      try {
        console.log('FirebaseInit - initialize - Starting...');
        const currentUser = auth.currentUser;
        console.log('FirebaseInit - initialize - Current user:', currentUser?.uid);
        
        if (!currentUser) {
          console.log('FirebaseInit - initialize - No user, clearing Redux store');
          if (isSubscribed) {
            dispatch(setUser(null));
          }
          return;
        }

        console.log('FirebaseInit - initialize - User authenticated:', currentUser.uid);
        
        // Get the user's profile from Firestore
        const userProfile = await getUserProfile(currentUser.uid);
        console.log('FirebaseInit - initialize - Fetched user profile:', userProfile);
        
        if (!isSubscribed) return;

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
            blocked: userProfile.blocked || false,
            phoneNumber: userProfile.phoneNumber || '',
            phoneVerified: userProfile.phoneVerified || false,
            isAdmin: false,
            verificationStatus: userProfile.verificationStatus || 'none',
            verificationStep: userProfile.verificationStep || 'email',
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
            collegeInfo: userProfile.collegeInfo,
            sponsorInfo: userProfile.sponsorInfo,
            mediaInfo: userProfile.mediaInfo
          };

          console.log('FirebaseInit - initialize - Dispatching user data:', userData);
          dispatch(setUser(userData));
          dispatch(updateEmailVerification(currentUser.emailVerified));
        } else {
          console.log('FirebaseInit - initialize - No profile found, creating new profile');
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
            blocked: false,
            phoneNumber: '',
            phoneVerified: false,
            isAdmin: false,
            verificationStatus: 'none',
            verificationStep: 'email',
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
            console.log('FirebaseInit - initialize - Dispatching new user:', newUser);
            dispatch(setUser(newUser));
            dispatch(updateEmailVerification(currentUser.emailVerified));
          }
        }
      } catch (error) {
        console.error('FirebaseInit - initialize - Error:', error);
        if (isSubscribed) {
          dispatch(setUser(null));
        }
      } finally {
        if (isSubscribed) {
          console.log('FirebaseInit - initialize - Cleanup');
          dispatch(setInitializing(false));
          dispatch(setLoading(false));
        }
      }
    };

    // Initialize immediately with current auth state
    initialize();

    // Set up auth state change listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isSubscribed) return;

      try {
        console.log('FirebaseInit - Auth state changed:', { user: firebaseUser?.uid });
        dispatch(setLoading(true));
        
        if (!firebaseUser) {
          console.log('FirebaseInit - Auth state changed - No user');
          dispatch(setUser(null));
          return;
        }

        console.log('FirebaseInit - Auth state changed - User authenticated:', firebaseUser.uid);
        
        // Get user profile
        const userProfile = await getUserProfile(firebaseUser.uid);
        console.log('FirebaseInit - Auth state changed - User profile:', userProfile);
        
        if (!isSubscribed) return;

        if (userProfile) {
          // Update Redux with existing profile
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
            blocked: userProfile.blocked || false,
            phoneNumber: userProfile.phoneNumber || '',
            phoneVerified: userProfile.phoneVerified || false,
            isAdmin: false,
            verificationStatus: userProfile.verificationStatus || 'none',
            verificationStep: userProfile.verificationStep || 'email',
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
            collegeInfo: userProfile.collegeInfo,
            sponsorInfo: userProfile.sponsorInfo,
            mediaInfo: userProfile.mediaInfo
          };
          
          console.log('FirebaseInit - Auth state changed - Dispatching user data:', userData);
          dispatch(setUser(userData));
          dispatch(updateEmailVerification(firebaseUser.emailVerified));
        }
      } catch (error) {
        console.error('FirebaseInit - Auth state changed - Error:', error);
        dispatch(setUser(null));
      } finally {
        if (isSubscribed) {
          dispatch(setLoading(false));
        }
      }
    });

    return () => {
      console.log('FirebaseInit - Cleanup');
      isSubscribed = false;
      unsubscribe();
      dispatch(setLoading(false));
      dispatch(setInitializing(false));
    };
  }, [dispatch]);

  return null;
};

export default FirebaseInit; 