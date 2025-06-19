using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using Metalink.Application.DTOs;
using Metalink.Application.Interfaces;
using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;
using Metalink.Domain.Services;
using MetaLink.Application.Interfaces;
using MetaLink.Application.Requests;
using MetaLink.Application.Responses;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Metalink.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly IUserService _userService;
        private readonly IStudentService _studentService;
        private readonly IConfiguration _configuration;

        public AuthService(IConfiguration configuration, IUserRepository userRepository, IMapper mapper, IPasswordHasher passwordHasher, ITokenService tokenService, IEmailService emailService, IUserService userService, IStudentService studentService)
        {
            _configuration = configuration;
            _userRepository = userRepository;
            _mapper = mapper;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
            _emailService = emailService;
            _userService = userService;
            _studentService = studentService;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
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

            var token = _tokenService.GenerateToken(newUser);

            var userDto = _mapper.Map<UserDTO>(newUser);
            return new AuthResponse
            {
                Token = token,
                User = userDto
            };
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await _userRepository.GetByEmailAsync(request.Email);
            if (user == null)
            {
                throw new Exception("User not found.");
            }

            bool validPassword = _passwordHasher.VerifyPassword(request.Password, user.Password);
            if (!validPassword)
            {
                throw new Exception("Invalid password.");
            }

            var token = _tokenService.GenerateToken(user);
            var userDto = _mapper.Map<UserDTO>(user);

            return new AuthResponse
            {
                Token = token,
                User = userDto
            };
        }

        public async Task<bool> CheckPinAsync(int userId, string pin)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new Exception("User not found.");

            return user.Pin == pin;
        }

        public async Task ForgotPasswordAsync(string email)
        {
            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null) return;

            user.PasswordResetToken = Guid.NewGuid().ToString();
            user.PasswordResetTokenExpires = DateTime.UtcNow.AddHours(1);
            await _userRepository.UpdateAsync(user);

            var resetLink = $"http://localhost:5173/forgot-password?token={user.PasswordResetToken}";
            await _emailService.SendForgotPasswordEmailAsync(user.Email, resetLink);
        }

        public async Task<bool> ResetPassword(ResetPasswordRequest request)
        {
            var user = await _userService.GetByResetTokenAsync(request.Token);
            if (user == null || user.PasswordResetTokenExpires < DateTime.UtcNow)
            {
                return false;
            }

            user.Password = _passwordHasher.HashPassword(request.Password);
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpires = null;

            await _userRepository.UpdateAsync(user);

            return true;
        }

        public async Task<string> CreateStudentToken(int studentId)
        {
            var student = await _studentService.GetByIdAsync(studentId);
            if (student == null)
                throw new ArgumentException("Student not found!", nameof(studentId));

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, student.StudentID.ToString()),
                new Claim("sub", student.StudentID.ToString()),
                new Claim("role", "student")
            };


            var key = _configuration["Jwt:Key"];
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: null,
                audience: null,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(6),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
