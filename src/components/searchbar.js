const Searchbar = () => {
    return (
        <>
            <div className="collapse top-search" id="collapseExample">
                <div className="card card-block">
                    <div className="newsletter-widget text-center">
                        <form className="form-inline">
                            <input type="text" className="form-control" placeholder="What you are looking for?" />
                            <button type="submit" className="btn btn-primary"><i className="fa fa-search" /></button>
                        </form>
                    </div>{/* end newsletter */}
                </div>
            </div>{/* end top-search */}
        </>
    )
}
export default Searchbar;