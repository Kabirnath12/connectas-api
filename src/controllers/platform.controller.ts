import { Request, Response } from "express";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

const auth=(req:AuthenticatedRequest,res:Response)=>{if(!req.userId){res.status(401).json({success:false,message:"Authentication required"});return false}return true};
const clean=(v:unknown)=>typeof v==="string"?v.trim():"";

export async function listListings(req:Request,res:Response){
  const type=clean(req.query.type);
  const q=clean(req.query.q);
  const listings=await prisma.listing.findMany({
    where:{...(type?{type:type as any}:{}),...(q?{OR:[{title:{contains:q,mode:"insensitive"}},{description:{contains:q,mode:"insensitive"}},{category:{contains:q,mode:"insensitive"}}]}:{})},
    orderBy:{createdAt:"desc"},take:50,
    include:{owner:{select:{id:true,name:true,profile:{select:{username:true,avatarUrl:true}}}}}
  });
  res.json({success:true,listings});
}
export async function createListing(req:AuthenticatedRequest,res:Response){
  if(!auth(req,res))return;
  const {type,title,description,price,location,imageUrl,category}=req.body;
  if(!title||!type)return res.status(400).json({success:false,message:"Title and type are required"});
  const listing=await prisma.listing.create({data:{ownerId:req.userId!,type,title,description,price:Number.isFinite(Number(price))?Number(price):null,location,imageUrl,category}});
  res.status(201).json({success:true,listing});
}

export async function listJobs(req:Request,res:Response){
  const q=clean(req.query.q), location=clean(req.query.location);
  const jobs=await prisma.job.findMany({where:{...(location?{location:{contains:location,mode:"insensitive"}}:{}),...(q?{OR:[{title:{contains:q,mode:"insensitive"}},{company:{contains:q,mode:"insensitive"}},{skills:{contains:q,mode:"insensitive"}}]}:{})},orderBy:{createdAt:"desc"},take:50,include:{owner:{select:{id:true,name:true}}}});
  res.json({success:true,jobs});
}
export async function createJob(req:AuthenticatedRequest,res:Response){
  if(!auth(req,res))return;
  const {title,company,description,skills,salary,location,type}=req.body;
  if(!title||!description)return res.status(400).json({success:false,message:"Title and description are required"});
  const job=await prisma.job.create({data:{ownerId:req.userId!,title,company,description,skills,salary,location,type:type||"FULL_TIME"}});
  res.status(201).json({success:true,job});
}
export async function applyJob(req:AuthenticatedRequest,res:Response){
  if(!auth(req,res))return;
  try{
    const application=await prisma.jobApplication.create({data:{jobId:String(req.params.jobId),applicantId:req.userId!,message:clean(req.body.message)||null}});
    res.status(201).json({success:true,application});
  }catch{res.status(409).json({success:false,message:"You have already applied or the job is invalid"});}
}

export async function search(req:Request,res:Response){
  const q=clean(req.query.q);
  if(!q)return res.json({success:true,profiles:[],jobs:[],listings:[]});
  const [profiles,jobs,listings]=await Promise.all([
    prisma.profile.findMany({where:{OR:[{username:{contains:q,mode:"insensitive"}},{bio:{contains:q,mode:"insensitive"}},{location:{contains:q,mode:"insensitive"}}]},take:20,include:{user:{select:{id:true,name:true}},capabilities:true,skills:true}}),
    prisma.job.findMany({where:{OR:[{title:{contains:q,mode:"insensitive"}},{company:{contains:q,mode:"insensitive"}},{skills:{contains:q,mode:"insensitive"}}]},take:20}),
    prisma.listing.findMany({where:{OR:[{title:{contains:q,mode:"insensitive"}},{description:{contains:q,mode:"insensitive"}},{category:{contains:q,mode:"insensitive"}}]},take:20})
  ]);
  res.json({success:true,profiles,jobs,listings});
}

export async function follow(req:AuthenticatedRequest,res:Response){
  if(!auth(req,res))return;
  const followingId=String(req.body.followingId||"");
  if(!followingId||followingId===req.userId)return res.status(400).json({success:false,message:"Invalid user"});
  const existing=await prisma.follow.findUnique({where:{followerId_followingId:{followerId:req.userId!,followingId}}});
  if(existing){await prisma.follow.delete({where:{id:existing.id}});return res.json({success:true,following:false});}
  await prisma.follow.create({data:{followerId:req.userId!,followingId}});
  await prisma.notification.create({data:{userId:followingId,type:"FOLLOW",message:"Someone followed you on CollabX."}});
  res.json({success:true,following:true});
}

export async function review(req:AuthenticatedRequest,res:Response){
  if(!auth(req,res))return;
  const revieweeId=String(req.body.revieweeId||""); const rating=Number(req.body.rating);
  if(!revieweeId||rating<1||rating>5)return res.status(400).json({success:false,message:"Rating must be 1-5"});
  try{const r=await prisma.review.create({data:{reviewerId:req.userId!,revieweeId,rating,text:clean(req.body.text)||null}});res.status(201).json({success:true,review:r});}
  catch{res.status(409).json({success:false,message:"You already reviewed this user"});}
}
