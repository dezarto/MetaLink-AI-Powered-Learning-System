using Metalink.Application.DTOs;

namespace MetaLink.Application.Responses
{
    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public UserDTO? User { get; set; }
    }
}
