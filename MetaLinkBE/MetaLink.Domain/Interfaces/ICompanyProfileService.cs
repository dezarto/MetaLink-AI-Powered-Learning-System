using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface ICompanyProfileService
    {
        Task<CompanyProfile?> GetCompanyProfileAsync();
        Task CreateCompanyProfileAsync(CompanyProfile profile);
        Task UpdateCompanyProfileAsync(CompanyProfile profile);
        Task DeleteCompanyProfileAsync(int id);
    }
}
