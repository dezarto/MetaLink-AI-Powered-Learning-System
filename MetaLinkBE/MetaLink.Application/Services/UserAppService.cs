using AutoMapper;
using Metalink.Application.DTOs;
using Metalink.Application.Interfaces;
using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;
using MetaLink.Application.DTOs;
using MetaLink.Application.Requests;
using MetaLink.Domain.Interfaces;

namespace Metalink.Application.Services
{
    public class UserAppService : IUserAppService
    {
        private readonly IMapper _mapper;
        private readonly IUserRepository _userRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ICompanyProfileService _companyProfileService;

        public UserAppService(IMapper mapper, IUserRepository userRepository, IPasswordHasher passwordHasher, ICompanyProfileService companyProfileService)
        {
            _mapper = mapper;
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _companyProfileService = companyProfileService;
        }

        public async Task<UserDTO?> GetUserByIdAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            return user == null ? null : _mapper.Map<UserDTO>(user);
        }

        public async Task<List<UserDTO>> GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllAsync();
            return _mapper.Map<List<UserDTO>>(users);
        }

        public async Task<UserDTO> CreateUserAsync(RegisterRequest request)
        {
            var existingUser = await _userRepository.GetByEmailAsync(request.Email);
            if (existingUser != null)
            {
                throw new Exception("User with this email already exists.");
            }

            var newUser = new User
            {
                Email = request.Email,
                Password = _passwordHasher.HashPassword(request.Password),
                Pin = request.Pin,
                FirstName = request.FirstName,
                LastName = request.LastName,
                DateOfBirth = request.DateOfBirth,
                Phone = request.Phone,
                IsActive = true
            };

            await _userRepository.AddAsync(newUser);

            return _mapper.Map<UserDTO>(newUser);
        }

        public async Task<bool> UpdateUserAsync(int id, UpdateParentRequest request)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) throw new Exception("User not found.");

            user.Email = request.Email;
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Phone = request.Phone;
            user.Pin = request.Pin;
            user.DateOfBirth = request.DateOfBirth;
            user.UpdateDate = DateTime.UtcNow;

            await _userRepository.UpdateAsync(user);

            return true;
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return false;

            await _userRepository.DeleteAsync(user);
            return true;
        }

        public async Task<bool> UpdatePassword(int id, UpdatePassword updatePassword)
        {
            var user = await _userRepository.GetByIdAsync(id);

            if(user == null) throw new ArgumentException("User not found!");

            if(updatePassword.NewPassword == updatePassword.ConfirmNewPassword)
            {
                var confirm = _passwordHasher.VerifyPassword(updatePassword.OldPassword, user.Password);

                var newHashPassword = _passwordHasher.HashPassword(updatePassword.NewPassword);

                user.Password = newHashPassword;

                await _userRepository.UpdateAsync(user); 
                
                return true;
            }

            return false;
        }

        public async Task<CompanyProfileDTO?> GetCompanyProfileAsync()
        {
            var entity = await _companyProfileService.GetCompanyProfileAsync();
            return entity is null ? null : _mapper.Map<CompanyProfileDTO>(entity);
        }
    }
}
