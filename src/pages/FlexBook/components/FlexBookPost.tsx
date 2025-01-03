import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Edit, Trash2, Share2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Post {
  id: string;
  user_id: string;
  title: string;
  image_url: string;
  caption: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface FlexBookPostProps {
  post: Post;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
}

export function FlexBookPost({ post, onEdit, onDelete }: FlexBookPostProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get the current user's ID when component mounts
    const getCurrentUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (userId) {
      checkIfLiked();
      fetchComments();
    }
  }, [post.id, userId]);

  const checkIfLiked = async () => {
    if (!userId) return;
    
    const { data: likes } = await supabase
      .from('flexbook_likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', userId)
      .single();
    
    setIsLiked(!!likes);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('flexbook_comments')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    
    if (data) {
      setComments(data);
    }
  };

  const handleLike = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    
    if (isLiked) {
      await supabase
        .from('flexbook_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', userId);
      
      setLikesCount(prev => prev - 1);
    } else {
      await supabase
        .from('flexbook_likes')
        .insert([{
          post_id: post.id,
          user_id: userId
        }]);
      
      setLikesCount(prev => prev + 1);
    }
    
    setIsLiked(!isLiked);
    setIsLoading(false);
  };

  const handleAddComment = async () => {
    if (!userId || newComment.trim() === '') return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('flexbook_comments')
      .insert([{
        post_id: post.id,
        user_id: userId,
        content: newComment,
        created_at: new Date().toISOString() // Explicitly set the timestamp
      }])
      .single();
    
    if (data) {
      setComments([...comments, data]);
      setNewComment('');
    }
    
    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post.title,
        text: post.caption,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{post.title}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(post)}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Edit post"
          >
            <Edit className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => onDelete(post.id)}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Delete post"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
          </button>
        </div>
      </div>
      
      <img 
        src={post.image_url} 
        alt={post.title} 
        className="w-full h-64 object-cover rounded-lg" 
      />
      
      <div className="mt-4">
        <p className="text-sm text-gray-600">{post.caption}</p>
        
        <div className="mt-2 flex items-center space-x-4">
          <button 
            onClick={handleLike} 
            disabled={isLoading || !userId}
            className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likesCount}</span>
          </button>
          
          <div className="flex items-center space-x-1 text-gray-600">
            <MessageCircle className="w-5 h-5" />
            <span>{comments.length}</span>
          </div>
          
          <button 
            onClick={handleShare} 
            className="flex items-center space-x-1 text-gray-600"
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
        </div>
        
        <div className="mt-4 space-y-2">
          {comments.map((comment) => (
            <div key={comment.id} className="text-sm text-gray-800 p-2 bg-gray-50 rounded">
              <div>{comment.content}</div>
              <div className="text-xs text-gray-400 mt-1">
                {formatDate(comment.created_at)}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex items-center space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <button 
            onClick={handleAddComment}
            disabled={isLoading || !newComment.trim() || !userId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}