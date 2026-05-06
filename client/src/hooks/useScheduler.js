import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export function useScheduler({ status, platform, month } = {}) {
  const [posts, setPosts]     = useState([]);
  const [byDay, setByDay]     = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status)   params.status   = status;
      if (platform) params.platform = platform;
      const { data } = await api.get("/posts", { params });
      setPosts(data.posts);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status, platform]);

  const fetchCalendar = useCallback(async (m) => {
    setLoading(true);
    try {
      const { data } = await api.get("/posts/calendar", { params: { month: m } });
      setByDay(data.byDay);
      setPosts(data.posts);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (month) fetchCalendar(month);
    else fetchPosts();
  }, [month, fetchPosts, fetchCalendar]);

  const schedulePost = async ({ contentId, platform, scheduledAt, note, timezone }) => {
    const { data } = await api.post("/posts/schedule", { contentId, platform, scheduledAt, note, timezone });
    setPosts((p) => [data.scheduledPost, ...p]);
    return data.scheduledPost;
  };

  const reschedule = async (id, scheduledAt) => {
    const { data } = await api.patch(`/posts/${id}/reschedule`, { scheduledAt });
    setPosts((p) => p.map((x) => x._id === id ? data.scheduledPost : x));
    return data.scheduledPost;
  };

  const publishNow = async (id) => {
    const { data } = await api.post(`/posts/${id}/publish-now`);
    setPosts((p) => p.map((x) => x._id === id ? data.scheduledPost : x));
    return data.scheduledPost;
  };

  const deletePost = async (id) => {
    await api.delete(`/posts/${id}`);
    setPosts((p) => p.filter((x) => x._id !== id));
  };

  return { posts, byDay, loading, error, schedulePost, reschedule, publishNow, deletePost, refresh: fetchPosts };
}
