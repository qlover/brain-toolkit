-- Backfill pam_projects.team_id from existing personal teams (slug personal-{owner_id}).
-- Projects whose owners have no personal team yet are healed lazily by PAMService.computeAccessRole.

UPDATE public.pam_projects AS p
SET team_id = t.id
FROM public.pam_role_teams AS t
WHERE p.team_id IS NULL
  AND p.is_deleted = 0
  AND t.is_deleted = 0
  AND t.slug = 'personal-' || p.owner_id::text;
