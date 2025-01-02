import { useState } from 'react';
    import { Heart, MessageCircle, Edit, Trash2, Share2 } from 'lucide-react';

    interface Post {
      id: string;
      user_id: string;
      title: string;
      image_url: string;
      caption: string;
      created_at: string;
    }

    interface FlexBookPostProps {
      post: Post;
      onEdit: (post: Post) => void;
      onDelete: (postId: string) => void;
    }

    export function FlexBookPost({ post, onEdit, onDelete }: FlexBookPostProps) {
      const [likes, setLikes] = useState(0);
      const [comments, setComments] = useState<string[]>([]);
      const [newComment, setNewComment] = useState('');

      const handleLike = () => {
        setLikes(likes + 1);
      };

      const handleAddComment = () => {
        if (newComment.trim() !== '') {
          setComments([...comments, newComment]);
          setNewComment('');
        }
      };

      const handleShare = () => {
        // Implement social media sharing logic here
        alert('Share functionality coming soon!');
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
          <img src={post.image_url} alt={post.title} className="w-full h-64 object-cover rounded-lg" />
          <div className="mt-4">
            <p className="text-sm text-gray-600">{post.caption}</p>
            <div className="mt-2 flex items-center space-x-4">
              <button onClick={handleLike} className="flex items-center space-x-1 text-gray-600">
                <Heart className="w-5 h-5" />
                <span>{likes}</span>
              </button>
              <button onClick={() => setNewComment('')} className="flex items-center space-x-1 text-gray-600">
                <MessageCircle className="w-5 h-5" />
                <span>{comments.length}</span>
              </button>
              <button onClick={handleShare} className="flex items-center space-x-1 text-gray-600">
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {comments.map((comment, index) => (
                <div key={index} className="text-sm text-gray-800">
                  {comment}
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
              <button onClick={handleAddComment} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Post
              </button>
            </div>
          </div>
        </div>
      );
    }
