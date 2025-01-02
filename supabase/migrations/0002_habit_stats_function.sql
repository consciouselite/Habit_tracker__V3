-- Function to get habit statistics for a user
    CREATE OR REPLACE FUNCTION get_user_habit_stats(p_user_id uuid)
    RETURNS TABLE (
      habit_id uuid,
      name text,
      current_streak integer,
      longest_streak integer,
      completion_rate numeric
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT
        h.id AS habit_id,
        h.name,
        COALESCE(hs.current_streak, 0) AS current_streak,
        COALESCE(hs.longest_streak, 0) AS longest_streak,
        COALESCE(hs.completion_rate, 0) AS completion_rate
      FROM
        habits h
      LEFT JOIN
        habit_stats hs ON h.id = hs.habit_id
      WHERE
        h.user_id = p_user_id;
    END;
    $$ LANGUAGE plpgsql;
