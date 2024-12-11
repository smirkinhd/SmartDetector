using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace BackendGermanSmartDetector.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImportController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public ImportController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("upload")]
        [RequestSizeLimit(50 * 1024 * 1024)] // 50 MB limit
        public async Task<IActionResult> Upload([FromForm] UploadModel model)
        {
            if (model.Video == null || model.Video.Length == 0)
            {
                return BadRequest(new { error = "Видео отсутствует." });
            }

            if (string.IsNullOrWhiteSpace(model.Points))
            {
                return BadRequest(new { error = "Точки отсутствуют." });
            }

            var videoPath = Path.GetTempFileName();
            await using (var stream = System.IO.File.Create(videoPath))
            {
                await model.Video.CopyToAsync(stream);
            }

            var points = JsonConvert.DeserializeObject<Dictionary<int, List<float>>>(model.Points);
            if (points == null)
            {
                return BadRequest(new { error = "Неверный формат точек." });
            }

            return Ok(points);  

            // реализовать связь с Python
        }

        public class UploadModel
        {
            [FromForm(Name = "points")]
            public string Points { get; set; }

            [FromForm(Name = "video")]
            public IFormFile Video { get; set; }
        }
    }
}
