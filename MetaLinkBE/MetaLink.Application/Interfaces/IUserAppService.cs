using Azure.Core;
using Metalink.Application.DTOs;
using MetaLink.Application.DTOs;
using MetaLink.Application.Requests;

namespace Metalink.Application.Interfaces
{
    public interface IUserAppService
    {
        Task<UserDTO?> GetUserByIdAsync(int id);
        Task<List<UserDTO>> GetAllUsersAsync();
        Task<UserDTO> CreateUserAsync(RegisterRequest request);
        Task<bool> UpdateUserAsync(int id, UpdateParentRequest request);
        Task<bool> DeleteUserAsync(int id);
        Task<bool> UpdatePassword(int userId, UpdatePassword updatePassword);
        Task<CompanyProfileDTO?> GetCompanyProfileAsync();
    }
}
