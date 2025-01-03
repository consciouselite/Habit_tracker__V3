import { useState, useEffect } from 'react';
    import { supabase } from '../../lib/supabase';
    import { useAuth } from '../../contexts/AuthContext';
    import { Button } from '../../components/ui/Button';
    import { FlexBookForm } from './components/FlexBookForm';
    import { FlexBookPost } from './components/FlexBookPost';
    import { BottomNav } from '../../components/BottomNav';

    interface Post {
      id: string;
      user_id: string;
      title: string;
      image_url: string;
      caption: string;
      created_at: string;
    }

    export function FlexBook() {
      const [posts, setPosts] = useState<Post[]>([]);
      const [showForm, setShowForm] = useState(false);
      const [editPost, setEditPost] = useState<Post | null>(null);
      const { user } = useAuth();

      useEffect(() => {
        if (!user) return;

        const fetchPosts = async () => {
          const { data, error } = await supabase
            .from('flexbook_posts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching posts:', error);
            return;
          }

          if (data) {
            setPosts(data);
          }
        };

        fetchPosts();
      }, [user]);

      const handleAddPost = () => {
        setEditPost(null);
        setShowForm(true);
      };

      const handleEditPost = (post: Post) => {
        setEditPost(post);
        setShowForm(true);
      };

      const handleCancelForm = () => {
        setShowForm(false);
        setEditPost(null);
      };

      const handleSavePost = async (newPost: { title: string; caption: string; image_url?: string }) => {
        if (!user) return;

        try {
          if (editPost) {
            // Update existing post
            const { data, error } = await supabase
              .from('flexbook_posts')
              .update({
                title: newPost.title,
                image_url: newPost.image_url,
                caption: newPost.caption,
              })
              .eq('id', editPost.id)
              .select()
              .single();

            if (error) throw error;

            setPosts(posts.map(post => ({...post, ...data})));
          } else {
            // Create new post
            const { data, error } = await supabase
              .from('flexbook_posts')
              .insert([{
                user_id: user.id,
                title: newPost.title,
                image_url: newPost.image_url,
                caption: newPost.caption,
              }])
              .select()
              .single();

            if (error) throw error;

            setPosts([data, ...posts]);
          }

          setShowForm(false);
          setEditPost(null);
        } catch (err) {
          console.error('Error saving post:', err);
        }
      };

      const handleDeletePost = async (postId: string) => {
        if (!user) return;

        try {
          const { error } = await supabase
            .from('flexbook_posts')
            .delete()
            .eq('id', postId);

          if (error) throw error;

          setPosts(posts.filter(post => post.id !== postId));
        } catch (err) {
          console.error('Error deleting post:', err);
        }
      };

      return (
        <div className="min-h-screen bg-gray-50 pb-16">
          <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">FlexBook</h2>
                <Button onClick={handleAddPost}>Add Post</Button>
              </div>
              <h5 className="text-gray-500 text-sm space-y-2">Upload photos and write captions to document your milestones, express gratitude, and reflect on your personal evolution.✨</h5>
            </div>
    
            {showForm && (
              <FlexBookForm
                onCancel={handleCancelForm}
                onSave={handleSavePost}
                initialPost={editPost}
              />
            )}
    
            <div className="space-y-2">
              {posts.map((post) => (
                <FlexBookPost
                  key={post.id}
                  post={post}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                />
              ))}
            </div>
          </div>
          <BottomNav />
        </div>
      );
    }