import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  increment,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Post, PostWithAuthor, Comment, MediaItem, Reaction, ReactionType } from '../types/post';
import { getUserProfile } from './user.service';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../types/user';

const POSTS_COLLECTION = 'posts';
const POSTS_PER_PAGE = 10;

export const uploadToCloudinary = async (file: File): Promise<MediaItem> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET!);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload media to Cloudinary');
    }

    const data = await response.json();
    
    // Validate required fields
    if (!data.public_id || !data.secure_url) {
      throw new Error('Invalid response from Cloudinary: missing required fields');
    }

    const mediaItem: MediaItem = {
      id: data.public_id,
      type: data.resource_type === 'image' ? 'image' : 'video',
      url: data.secure_url,
      path: data.public_id,
      filename: file.name
    };

    // Validate the media item
    if (!mediaItem.url || !mediaItem.id) {
      throw new Error('Failed to create valid media item');
    }

    return mediaItem;
  } catch (error) {
    console.error('Error in uploadToCloudinary:', error);
    throw error;
  }
};

export const createPost = async (
  userId: string,
  data: {
    content: string;
    media?: MediaItem[];
    visibility?: 'public' | 'followers' | 'connections' | 'private';
  }
): Promise<string> => {
  try {
    const postData = {
      authorId: userId,
      content: data.content,
      media: data.media || [],
      visibility: data.visibility || 'public',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      reactions: [],
      comments: [],
      shares: 0,
      isEdited: false
    };
    
    const docRef = await addDoc(collection(db, 'posts'), postData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const getPost = async (postId: string): Promise<PostWithAuthor | null> => {
  try {
    const postDoc = await getDoc(doc(db, POSTS_COLLECTION, postId));
    if (!postDoc.exists()) return null;

    const postData = postDoc.data() as Post;
    const author = await getUserProfile(postData.authorId);
    if (!author) return null;

    return {
      ...postData,
      author
    };
  } catch (error) {
    console.error('Error getting post:', error);
    throw error;
  }
};

export const getFeed = async (user: User): Promise<PostWithAuthor[]> => {
  try {
    const postsRef = collection(db, 'posts');
    
    // Create queries for different visibility levels
    const publicPostsQuery = query(
      postsRef,
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc')
    );

    const userPostsQuery = query(
      postsRef,
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const followersPostsQuery = user.following?.length ? query(
      postsRef,
      where('visibility', '==', 'followers'),
      where('authorId', 'in', user.following.slice(0, 10)), // Firestore limits 'in' to 10 values
      orderBy('createdAt', 'desc')
    ) : null;

    const connectionsPostsQuery = user.connections?.length ? query(
      postsRef,
      where('visibility', '==', 'connections'),
      where('authorId', 'in', user.connections.slice(0, 10)), // Firestore limits 'in' to 10 values
      orderBy('createdAt', 'desc')
    ) : null;

    // Execute all queries in parallel
    const [publicPosts, userPosts, followersPosts, connectionsPosts] = await Promise.all([
      getDocs(publicPostsQuery),
      getDocs(userPostsQuery),
      followersPostsQuery ? getDocs(followersPostsQuery) : Promise.resolve(null),
      connectionsPostsQuery ? getDocs(connectionsPostsQuery) : Promise.resolve(null)
    ]);

    // Combine and process results
    const allPosts = new Map<string, PostWithAuthor>();

    const processQuerySnapshot = async (snapshot: QuerySnapshot<DocumentData> | null) => {
      if (!snapshot) return;
      for (const doc of snapshot.docs) {
        if (!allPosts.has(doc.id)) {
          const postData = doc.data() as Post;
          const authorData = await getUserProfile(postData.authorId);
          if (authorData) {
            allPosts.set(doc.id, {
              ...postData,
              id: doc.id,
              author: authorData
            });
          }
        }
      }
    };

    await Promise.all([
      processQuerySnapshot(publicPosts),
      processQuerySnapshot(userPosts),
      processQuerySnapshot(followersPosts),
      processQuerySnapshot(connectionsPosts)
    ]);

    // Convert to array and sort by createdAt
    return Array.from(allPosts.values())
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      .slice(0, 20); // Limit to 20 most recent posts

  } catch (error) {
    console.error('Error getting feed:', error);
    throw error;
  }
};

export const updatePost = async (
  postId: string,
  userId: string,
  updates: {
    content?: string;
    media?: { add?: File[]; remove?: string[] };
    visibility?: 'public' | 'connections' | 'private';
    tags?: string[];
  }
): Promise<void> => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) throw new Error('Post not found');
    if (postDoc.data().authorId !== userId) throw new Error('Unauthorized');

    const updateData: any = {
      updatedAt: serverTimestamp(),
      isEdited: true
    };

    if (updates.content) {
      updateData.content = updates.content;
      updateData.mentions = extractMentions(updates.content);
      updateData.hashtags = extractHashtags(updates.content);
    }

    if (updates.visibility) {
      updateData.visibility = updates.visibility;
    }

    if (updates.tags) {
      updateData.tags = updates.tags;
    }

    // Handle media updates
    if (updates.media) {
      const currentMedia = postDoc.data().media || [];
      
      // Remove specified media
      if (updates.media.remove) {
        // Note: You might want to add Cloudinary deletion here if needed
        updateData.media = currentMedia.filter(
          (m: MediaItem) => !updates.media?.remove?.includes(m.id)
        );
      }

      // Add new media
      if (updates.media.add) {
        const newMediaItems = await Promise.all(
          updates.media.add.map(file => uploadToCloudinary(file))
        );

        updateData.media = [...(updateData.media || currentMedia), ...newMediaItems];
      }
    }

    await updateDoc(postRef, updateData);
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

export const deletePost = async (postId: string, userId: string): Promise<void> => {
  try {
    console.log('deletePost service called with postId:', postId, 'userId:', userId);
    
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      console.error('Post not found:', postId);
      throw new Error('Post not found');
    }
    
    const postData = postDoc.data();
    console.log('Post data:', postData);
    
    // Direct comparison with authorId from post data
    if (!postData.authorId) {
      console.error('Post data is missing authorId field:', postData);
      throw new Error('Invalid post data: missing author information');
    }

    if (postData.authorId !== userId) {
      console.error('Unauthorized deletion attempt. Post authorId:', postData.authorId, 'Request user:', userId);
      throw new Error('Unauthorized: You do not have permission to delete this post');
    }

    // Delete post media from Cloudinary if exists
    if (postData.media && Array.isArray(postData.media)) {
      for (const mediaItem of postData.media) {
        if (mediaItem.url && mediaItem.url.includes('cloudinary.com')) {
          try {
            const publicId = mediaItem.path || mediaItem.url.split('/').pop()?.split('.')[0];
            if (publicId) {
              await fetch(`https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/destroy`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  public_id: publicId,
                  api_key: process.env.REACT_APP_CLOUDINARY_API_KEY,
                  api_secret: process.env.REACT_APP_CLOUDINARY_API_SECRET,
                }),
              });
            }
          } catch (error) {
            console.error('Error deleting post media from Cloudinary:', error);
            // Continue with post deletion even if media deletion fails
          }
        }
      }
    }

    console.log('Deleting post document...');
    await deleteDoc(postRef);
    console.log('Post deleted successfully');
  } catch (error) {
    console.error('Error in deletePost service:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    } else {
      throw new Error('Failed to delete post: Unknown error');
    }
  }
};

export const addComment = async (
  postId: string,
  userId: string,
  content: string
): Promise<void> => {
  try {
    const comment: Comment = {
      id: uuidv4(),
      userId,
      content,
      reactions: [],
      createdAt: Timestamp.now(),
      isEdited: false
    };

    await updateDoc(doc(db, POSTS_COLLECTION, postId), {
      comments: arrayUnion(comment)
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const updateComment = async (
  postId: string,
  commentId: string,
  userId: string,
  content: string
): Promise<void> => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) throw new Error('Post not found');
    
    const comments = postDoc.data().comments || [];
    const commentIndex = comments.findIndex((c: Comment) => c.id === commentId);
    
    if (commentIndex === -1) throw new Error('Comment not found');
    if (comments[commentIndex].userId !== userId) throw new Error('Unauthorized');

    comments[commentIndex] = {
      ...comments[commentIndex],
      content,
      isEdited: true
    };

    await updateDoc(postRef, { comments });
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

export const deleteComment = async (
  postId: string,
  commentId: string,
  userId: string
): Promise<void> => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) throw new Error('Post not found');
    
    const comments = postDoc.data().comments || [];
    const comment = comments.find((c: Comment) => c.id === commentId);
    
    if (!comment) throw new Error('Comment not found');
    if (comment.userId !== userId) throw new Error('Unauthorized');

    await updateDoc(postRef, {
      comments: arrayRemove(comment)
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

export const addReaction = async (
  postId: string,
  userId: string,
  type: ReactionType
): Promise<void> => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) throw new Error('Post not found');
    
    const reactions = postDoc.data().reactions || [];
    const existingReaction = reactions.find(
      (r: Reaction) => r.userId === userId
    );

    if (existingReaction) {
      // Update existing reaction
      await updateDoc(postRef, {
        reactions: reactions.map((r: Reaction) =>
          r.userId === userId ? { ...r, type } : r
        )
      });
    } else {
      // Add new reaction with regular timestamp
      await updateDoc(postRef, {
        reactions: arrayUnion({
          userId,
          type,
          createdAt: Timestamp.now()
        })
      });
    }
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
};

export const removeReaction = async (
  postId: string,
  userId: string
): Promise<void> => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) throw new Error('Post not found');
    
    const reactions = postDoc.data().reactions || [];
    const reaction = reactions.find((r: Reaction) => r.userId === userId);
    
    if (reaction) {
      await updateDoc(postRef, {
        reactions: arrayRemove(reaction)
      });
    }
  } catch (error) {
    console.error('Error removing reaction:', error);
    throw error;
  }
};

export const sharePost = async (postId: string, userId: string): Promise<void> => {
  try {
    // Instead of directly incrementing shares, we'll add a share reaction
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      reactions: arrayUnion({
        userId,
        type: 'share' as ReactionType,
        createdAt: Timestamp.now()
      })
    });
  } catch (error) {
    console.error('Error sharing post:', error);
    throw error;
  }
};

export const getUserPosts = async (
  userId: string,
  lastVisible?: DocumentSnapshot<DocumentData>
): Promise<{
  posts: PostWithAuthor[];
  lastVisible: DocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}> => {
  try {
    console.log('getUserPosts called with userId:', userId);
    const postsRef = collection(db, POSTS_COLLECTION);
    let q = query(
      postsRef,
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(POSTS_PER_PAGE)
    );

    if (lastVisible) {
      console.log('Using pagination with lastVisible document');
      q = query(
        postsRef,
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(POSTS_PER_PAGE)
      );
    }

    console.log('Executing Firestore query...');
    const querySnapshot = await getDocs(q);
    console.log('Query results:', querySnapshot.docs.length, 'documents found');
    
    const posts: PostWithAuthor[] = [];
    
    console.log('Fetching author profile...');
    const author = await getUserProfile(userId);
    if (!author) {
      console.error('Author profile not found for userId:', userId);
      throw new Error('Author not found');
    }
    console.log('Author profile found:', author.displayName);

    for (const doc of querySnapshot.docs) {
      const postData = doc.data() as Post;
      console.log('Processing post:', doc.id, postData);
      posts.push({
        ...postData,
        id: doc.id,
        author
      });
    }

    const result = {
      posts,
      lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
      hasMore: querySnapshot.docs.length === POSTS_PER_PAGE
    };
    console.log('Returning result:', result);
    return result;
  } catch (error) {
    console.error('Error getting user posts:', error);
    throw error;
  }
};

// Helper functions
const extractMentions = (content: string): string[] => {
  const mentionRegex = /@[\w-]+/g;
  return Array.from(new Set(content.match(mentionRegex) || []));
};

const extractHashtags = (content: string): string[] => {
  const hashtagRegex = /#[\w-]+/g;
  return Array.from(new Set(content.match(hashtagRegex) || []));
}; 