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
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Post, PostWithAuthor, Comment, MediaItem, Reaction, ReactionType } from '../types/post';
import { getUserProfile } from './user.service';
import { v4 as uuidv4 } from 'uuid';

const POSTS_COLLECTION = 'posts';
const POSTS_PER_PAGE = 10;

const uploadToCloudinary = async (file: File): Promise<MediaItem> => {
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
  return {
    id: data.public_id,
    type: data.resource_type === 'image' ? 'image' : 'video',
    url: data.secure_url,
    path: data.public_id,
    filename: file.name
  };
};

export const createPost = async (
  userId: string,
  content: string,
  mediaFiles?: File[],
  visibility: 'public' | 'connections' | 'private' = 'public',
  tags: string[] = []
): Promise<string> => {
  try {
    // Handle media uploads first
    const mediaItems: MediaItem[] = [];
    if (mediaFiles && mediaFiles.length > 0) {
      for (const file of mediaFiles) {
        const mediaItem = await uploadToCloudinary(file);
        mediaItems.push(mediaItem);
      }
    }

    // Create the post document
    const postData: Omit<Post, 'id'> = {
      authorId: userId,
      content,
      media: mediaItems,
      visibility,
      tags,
      reactions: [],
      comments: [],
      shares: 0,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      isEdited: false,
      mentions: extractMentions(content),
      hashtags: extractHashtags(content)
    };

    const postRef = await addDoc(collection(db, POSTS_COLLECTION), postData);
    return postRef.id;
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

export const getFeed = async (
  userId: string,
  lastPost?: DocumentSnapshot,
  filter: 'all' | 'following' | 'trending' = 'all'
): Promise<{ posts: PostWithAuthor[]; lastVisible: DocumentSnapshot | null; hasMore: boolean }> => {
  try {
    console.log('Getting feed for user:', userId, 'filter:', filter);
    let postsQuery;

    if (filter === 'following') {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const following = userDoc.data()?.following || [];
      postsQuery = query(
        collection(db, POSTS_COLLECTION),
        where('authorId', 'in', [...following, userId]),
        orderBy('createdAt', 'desc'),
        limit(POSTS_PER_PAGE + 1)
      );
    } else if (filter === 'trending') {
      postsQuery = query(
        collection(db, POSTS_COLLECTION),
        where('visibility', '==', 'public'),
        orderBy('createdAt', 'desc'),
        limit(POSTS_PER_PAGE + 1)
      );
    } else {
      // Default 'all' filter - get posts that are either public OR created by the user
      postsQuery = query(
        collection(db, POSTS_COLLECTION),
        where('visibility', '==', 'public'),
        orderBy('createdAt', 'desc'),
        limit(POSTS_PER_PAGE)
      );
    }

    if (lastPost) {
      postsQuery = query(postsQuery, startAfter(lastPost));
    }

    console.log('Executing posts query...');
    const snapshot = await getDocs(postsQuery);
    console.log('Got', snapshot.docs.length, 'posts from query');
    
    const posts: PostWithAuthor[] = [];
    let lastVisible: DocumentSnapshot | null = null;

    const hasMore = snapshot.docs.length > POSTS_PER_PAGE;
    const docsToProcess = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;

    // Process posts and get author profiles
    for (const doc of docsToProcess) {
      const postData = doc.data() as Post;
      try {
        const author = await getUserProfile(postData.authorId);
        if (author) {
          posts.push({
            ...postData,
            id: doc.id,
            author
          });
        }
      } catch (error) {
        console.error('Error getting author for post:', doc.id, error);
      }
    }

    // If we're in 'all' mode, also get the user's own posts
    if (filter === 'all') {
      const userPostsQuery = query(
        collection(db, POSTS_COLLECTION),
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(POSTS_PER_PAGE)
      );

      const userSnapshot = await getDocs(userPostsQuery);
      console.log('Got', userSnapshot.docs.length, 'user posts');

      for (const doc of userSnapshot.docs) {
        const postData = doc.data() as Post;
        try {
          const author = await getUserProfile(postData.authorId);
          if (author) {
            posts.push({
              ...postData,
              id: doc.id,
              author
            });
          }
        } catch (error) {
          console.error('Error getting author for user post:', doc.id, error);
        }
      }
    }

    // Sort all posts by creation date
    posts.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    // Take only POSTS_PER_PAGE posts
    const postsToReturn = posts.slice(0, POSTS_PER_PAGE);
    
    if (hasMore) {
      lastVisible = snapshot.docs[POSTS_PER_PAGE - 1];
    }

    console.log('Returning', postsToReturn.length, 'posts');
    return { posts: postsToReturn, lastVisible, hasMore };
  } catch (error) {
    console.error('Error in getFeed:', error);
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
      createdAt: serverTimestamp() as Timestamp,
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
      // Add new reaction
      await updateDoc(postRef, {
        reactions: arrayUnion({
          userId,
          type,
          createdAt: serverTimestamp()
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

export const sharePost = async (postId: string): Promise<void> => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      shares: increment(1)
    });
  } catch (error) {
    console.error('Error sharing post:', error);
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