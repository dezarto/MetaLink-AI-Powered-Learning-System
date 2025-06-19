using Metalink.Domain.Entities;
using MetaLink.Application.Requests;
using MetaLink.Application.Responses;

namespace Metalink.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse> RegisterAsync(RegisterRequest request);
        Task<AuthResponse> LoginAsync(LoginRequest request);

        Task<bool> CheckPinAsync(int userId, string pin);
        Task ForgotPasswordAsync(string email);
        Task<bool> ResetPassword(ResetPasswordRequest request);
        Task<string> CreateStudentToken(int studentId);
    }
}
