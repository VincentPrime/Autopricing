import { 
  Popover,
  PopoverTrigger,
  PopoverContent, 
} from "./components/ui/popover"
import { MessageCircleQuestionMark } from "lucide-react"

import {    
  Dialog,
  DialogContent,
  DialogTrigger,
} from "./components/ui/dialog"

export default function Faqs(){
    

return(
        <>
        <div>
            <Popover>
            <PopoverTrigger asChild className="fixed bottom-8 left-8 z-50">
                    <MessageCircleQuestionMark size={50} className="text-gray-600" />
            </PopoverTrigger>
            <PopoverContent align="start" >
                <div>
                    <Dialog>
                        <DialogTrigger className='border-none cursor-pointer hover:text-gray-500' >FAQs</DialogTrigger>
                        <DialogContent>
                          
                            <div>
                                <h2 className="text-lg font-semibold mb-2">Frequently Asked Questions (FAQs)</h2>
                                <div className="space-y-4">

                                <div>
                                    <p className="font-medium">1. What is AutoPricing?</p>
                                    <p>
                                    AutoPricing is a smart pricing calculator that helps businesses 
                                    determine accurate selling prices based on costs and desired profit.
                                    </p>
                                </div>

                                <div>
                                    <p className="font-medium">2. What pricing method does it use?</p>
                                    <p>
                                    The system uses Cost-Plus Pricing, where a markup percentage 
                                    is added to the total cost per unit.
                                    </p>
                                </div>

                                <div>
                                    <p className="font-medium">3. Why should I include fixed costs?</p>
                                    <p>
                                    Including fixed costs ensures that all expenses are covered 
                                    and prevents underpricing.
                                    </p>
                                </div>

                                <div>
                                    <p className="font-medium">4. What happens if production increases?</p>
                                    <p>
                                    Increasing production lowers the fixed cost per unit, 
                                    which can increase profitability.
                                    </p>
                                </div>

                                <div>
                                    <p className="font-medium">5. Can I change the markup?</p>
                                    <p>
                                    Yes. You can adjust the markup percentage depending on your 
                                    desired profit margin.
                                    </p>
                                </div>

                                <div>
                                    <p className="font-medium">6. Why is my selling price high?</p>
                                    <p>
                                    It may be due to high fixed costs, high variable costs, 
                                    low production volume, or a high markup percentage.
                                    </p>
                                </div>

                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                <div>
                    <Dialog>
                    <DialogTrigger className='border-none cursor-pointer hover:text-gray-500' >Definition of Terms</DialogTrigger>
                    <DialogContent>
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Definition of Terms</h2>
                            <ul className="space-y-2 list-disc pl-5">

                            <li>
                                <strong>AutoPricing</strong> – A smart pricing calculator system 
                                that automatically computes selling prices using Cost-Plus Pricing.
                            </li>

                            <li>
                                <strong>Fixed Costs</strong> – Expenses that remain constant 
                                regardless of production volume (e.g., rent, utilities, depreciation).
                            </li>

                            <li>
                                <strong>Variable Costs</strong> – Costs that change depending on 
                                the number of units produced (e.g., materials, labor, packaging).
                            </li>

                            <li>
                                <strong>Fixed Cost per Unit</strong> – Total Fixed Costs divided by 
                                the number of units produced.
                            </li>

                            <li>
                                <strong>Cost per Unit</strong> – Fixed Cost per Unit plus Variable Cost per Unit.
                            </li>

                            <li>
                                <strong>Markup Percentage</strong> – The percentage added to the 
                                cost per unit to determine profit.
                            </li>

                            <li>
                                <strong>Selling Price</strong> – Final price after adding markup.
                            </li>

                            <li>
                                <strong>Profit per Unit</strong> – Selling Price minus Cost per Unit.
                            </li>

                            <li>
                                <strong>Cost-Plus Pricing</strong> – A pricing strategy where a 
                                markup percentage is added to total cost.
                            </li>

                            </ul>
                        </div>
                    </DialogContent>
                    </Dialog>
                  
                </div>
            </PopoverContent>
            </Popover>
        </div>

        </>
    )
}