using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;

namespace Metalink.Domain.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }
        public async Task<User> CreateAsync(User user)
        {
            await _userRepository.AddAsync(user);
            return user;
        }
        public async Task DeleteAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user != null)
            {
                await _userRepository.DeleteAsync(user);
            }
            else
            {
                // Handle not found, e.g., throw an exception or return a status
                throw new Exception("User not found.");
            }
        }
        public async Task<IEnumerable<User>> GetAllAsync()
        {
            return await _userRepository.GetAllAsync();
        }
        public async Task<User> GetByIdAsync(int id)
        {
            return await _userRepository.GetByIdAsync(id);
        }

        public async Task<User?> GetByResetTokenAsync(string resetToken)
        {
            return await _userRepository.GetByResetTokenAsync(resetToken);
        }

        public async Task UpdateAsync(User user)
        {
            await _userRepository.UpdateAsync(user);
        }
    }
}
