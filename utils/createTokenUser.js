const createTokenUser = (user) => {
  return {
    name: user.name,
    userId: user.id,
    email: user.email,
    role: user.role,
    bio: user.bio,
    image: user.profile_picture,
  };
};

module.exports = createTokenUser;
