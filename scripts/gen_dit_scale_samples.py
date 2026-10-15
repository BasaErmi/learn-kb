"""DiT-XL/2-256 预训练权重：同类别、同种子，只改 guidance scale s 的真实采样。

CFG 按 eps = eps_uncond + s * (eps_cond - eps_uncond)，作用于全部 4 个 latent 通道；
DDIM(eta=0) 确定性采样，同一种子在各 s 下起点完全相同。
"""
import argparse, json, os, time
import torch
from diffusers.models import DiTTransformer2DModel, AutoencoderKL
from diffusers.schedulers import DDIMScheduler

p = argparse.ArgumentParser()
p.add_argument("--out", required=True)
p.add_argument("--scales", default="1,1.5,2,3,4,6,10")
p.add_argument("--seeds", default="0,1,2,3,4,5,6,7")
p.add_argument("--cls", type=int, default=207)  # ImageNet 207 = golden retriever
p.add_argument("--steps", type=int, default=50)
p.add_argument("--device", default="cuda")
a = p.parse_args()

repo = "facebook/DiT-XL-2-256"
dev = torch.device(a.device)
model = DiTTransformer2DModel.from_pretrained(repo, subfolder="transformer").to(dev).eval()
vae = AutoencoderKL.from_pretrained(repo, subfolder="vae").to(dev).eval()
sched = DDIMScheduler.from_pretrained(repo, subfolder="scheduler")
scales = [float(x) for x in a.scales.split(",")]
seeds = [int(x) for x in a.seeds.split(",")]
os.makedirs(a.out, exist_ok=True)
NULL = 1000  # DiT 的“无条件”类别编号

@torch.no_grad()
def sample(seed, s):
    g = torch.Generator("cpu").manual_seed(seed)
    x = torch.randn(1, 4, 32, 32, generator=g).to(dev)
    sched.set_timesteps(a.steps)
    labels = torch.tensor([a.cls, NULL], device=dev)
    for t in sched.timesteps:
        out = model(torch.cat([x, x]), timestep=t.expand(2).to(dev), class_labels=labels).sample
        eps_c, eps_u = out[:, :4].chunk(2)  # 后 4 通道是学到的方差，DDIM 不用
        eps = eps_u + s * (eps_c - eps_u)
        x = sched.step(eps, t, x, eta=0.0).prev_sample
    img = vae.decode(x / 0.18215).sample
    img = ((img.clamp(-1, 1) + 1) * 127.5).round().byte()[0].permute(1, 2, 0).cpu().numpy()
    return img

from PIL import Image
log = []
for seed in seeds:
    for s in scales:
        t0 = time.time()
        Image.fromarray(sample(seed, s)).save(f"{a.out}/seed{seed}_s{s:g}.png")
        log.append({"seed": seed, "s": s, "sec": round(time.time() - t0, 2)})
        print(log[-1], flush=True)
json.dump({"repo": repo, "cls": a.cls, "steps": a.steps, "scheduler": "DDIM eta=0", "runs": log},
          open(f"{a.out}/meta.json", "w"), indent=1)
