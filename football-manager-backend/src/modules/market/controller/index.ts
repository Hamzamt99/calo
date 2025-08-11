import { Router, Request, Response } from 'express';
import { MarketService } from '../services';
import { sendResponse } from '../response';
import { AuthenticatedRequest } from '../../../types';

export class MarketController {
  private router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // GET /market?teamName=&playerName=&maxPrice=
    this.router.get('/', this.getListings);

    // POST /market/listings – list your own player
    this.router.post('/listings', this.addListing);

    // DELETE /market/listings/:id – remove your own listing
    this.router.delete('/listings/:id', this.removeListing);

    // POST /market/listings/:id/buy – buy a listing
    this.router.post('/listings/:id/buy', this.buyListing);
  }

  // GET /market
  private getListings = async (req: Request, res: Response) => {
    try {
      const { teamName, playerName, maxPrice } = req.query;
      const listings = await MarketService.getListings({
        teamName: teamName as string,
        playerName: playerName as string,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      });
      sendResponse(res, 200, 'OK', listings);
    } catch (err) {
      sendResponse(res, 500, (err as Error).message);
    }
  };

  // POST /market/listings
  private addListing = async (req: Request, res: Response) => {
    try {
      const request = req as AuthenticatedRequest;
      const sellerTeamId = request.member_id!;
      const { playerId, askingPrice } = req.body;
      const listing = await MarketService.addListing(sellerTeamId, { playerId, askingPrice });
      sendResponse(res, 201, 'Player listed', listing);
    } catch (err) {
      sendResponse(res, 400, (err as Error).message);
    }
  };

  // DELETE /market/listings/:id
  private removeListing = async (req: Request, res: Response) => {
    try {
      const request = req as AuthenticatedRequest;
      const sellerTeamId = request.member_id!;
      const listingId = Number(req.params.id);
      await MarketService.removeListing(sellerTeamId, listingId);
      sendResponse(res, 200, 'Listing removed');
    } catch (err) {
      sendResponse(res, 400, (err as Error).message);
    }
  };

  // POST /market/listings/:id/buy
  private buyListing = async (req: Request, res: Response) => {
    try {
      const request = req as AuthenticatedRequest;
      const buyerTeamId = request.member_id!;
      const listingId = Number(req.params.id);
      const result = await MarketService.buyListing(buyerTeamId, listingId);
      sendResponse(res, 200, 'Purchase successful', result);
    } catch (err) {
      sendResponse(res, 400, (err as Error).message);
    }
  };

  public getRouter(): Router {
    return this.router;
  }
}