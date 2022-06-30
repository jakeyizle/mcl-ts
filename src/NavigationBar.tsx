import * as React from 'react';

export default class NavigationBar extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.onNavClick = this.onNavClick.bind(this);
  };

  onNavClick(e: any) {
    this.props.handleOnClick(e.target.getAttribute('name'));
  }

  render() {
    //@ts-ignore
    let navItems = this.props.navItems.map((x: any) => <div key={x} name={x} className="navitem" onClick={this.onNavClick}>{x}</div>)
    return (<div className="sidenav">{navItems}</div>)
  }
}
