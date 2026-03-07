import { ConsoleSection } from '../ConsoleSection';
import { ControlModule } from './ControlModule';

export const DatabaseActions = () => {
    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                {/* Section 01: Standard Injections */}
                <div className="lg:col-span-8">
                    <ConsoleSection title="Additive Injections">
                        <div className="border-gunmetal bg-gunmetal grid grid-cols-1 border-4 shadow-[12px_12px_0px_0px_rgba(32,39,47,0.1)] md:grid-cols-2">
                            <ControlModule
                                id="ADD_01"
                                title="Orders_Append"
                                type="add_sales"
                                description="Inject 50 randomized ledger entries into active tables."
                            />
                            <ControlModule
                                id="ADD_02"
                                title="Promo_Generate"
                                type="seed_discounts"
                                description="Batch create 5 unique discount vectors with logic rules."
                            />
                            <ControlModule
                                id="ADD_03"
                                title="Review_Bomb"
                                type="review_bomb"
                                description="Social Proof: Inject 50 randomized reviews across the library."
                            />
                            <ControlModule
                                id="ADD_04"
                                title="Carts_Populate"
                                type="add_carts"
                                description="Create 15 active carts with 1-3 random items each."
                            />
                            <ControlModule
                                id="ADD_05"
                                title="Wishlist_Fill"
                                type="add_wishlists"
                                description="Distribute 50 wishlist items across the user registry."
                            />
                            <ControlModule
                                id="ADD_06"
                                title="Books_Expansion"
                                type="add_books"
                                description="Inject 50 books into the system."
                            />
                        </div>
                    </ConsoleSection>
                </div>

                {/* Section 02: Nuclear Reset */}
                <div className="lg:col-span-4">
                    <ConsoleSection
                        title="Danger Zone"
                        variant="danger"
                    >
                        <div className="border-yellow bg-yellow relative flex flex-col gap-0.5 overflow-hidden border-4 shadow-[12px_12px_0px_0px_rgba(247,203,21,0.1)]">
                            <ControlModule
                                id="DANGER_01"
                                title="Atomic Reset"
                                type="reset"
                                description="Warning: Action will purge all relational data."
                            />
                            <ControlModule
                                id="DANGER_02"
                                title="Stock_Purge"
                                type="stock_purge"
                                description="Stress Test: Set 50% of your book inventory to out-of-stock."
                            />
                        </div>
                    </ConsoleSection>
                </div>
            </div>
        </div>
    );
};
