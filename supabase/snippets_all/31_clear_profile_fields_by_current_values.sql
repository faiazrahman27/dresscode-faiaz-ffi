update public.code_profiles
set
  full_name = '',
  bio = ''
where
  full_name = 'Your Name'
  or bio = 'Short bio goes here.';
