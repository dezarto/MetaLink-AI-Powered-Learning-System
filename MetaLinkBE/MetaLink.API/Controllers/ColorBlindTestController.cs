using MetaLink.Application.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin, User, Student")]
public class ColorBlindTestController : ControllerBase
{
    private readonly IColorBlindTestAppService _svc;
    public ColorBlindTestController(IColorBlindTestAppService svc)
        => _svc = svc;

    [HttpGet("plates/{studentId}")]
    public async Task<IActionResult> GetPlates(int studentId)
    {
  
        var plates = await _svc.GetColorBlindPlatesAsync(studentId);

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        plates.ForEach(p => p.ImageUrl = $"{baseUrl}{p.ImageUrl}");

        return Ok(plates);
    }

    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] ColorBlindTestRequest req)
    {
        var resp = await _svc.SubmitColorBlindTestAsync(req);
        if (!resp.Success) return BadRequest(resp);
        return Ok(resp);
    }
}
