
/*
	Job: Keep a THREE.Object3D that contains the 3D content
	Knows: Its size and limits, and the THREE.Object3D containing the content and its transform.
*/

import { Object3D } from 'three'

import BoxComponent from './core/BoxComponent';
import Frame from '../content/Frame';
import DeepDelete from '../utils/DeepDelete';

function Block( options ) {

	const block = Object.create( BoxComponent() );

	block.type = 'Block';

	const frameContainer = new Object3D();
	frameContainer.name = "MeshUI-FrameContainer"
	block.add( frameContainer );

	block.frameContainer = frameContainer;

	////////////
	//  UPDATE
	////////////

	block.parseParams = function ParseParams( resolveParent, rejectParent ) {

		const promises = block.children.map( (child)=> {

			if ( !child.parseParams ) return

			return new Promise((resolve, reject)=> {

				child.parseParams( resolve, reject );

			});

		});

		Promise.all( promises ).then( ()=> {

			resolveParent();

		});

	};

	block.updateLayout = function UpdateLayout() {

		// Get temporary dimension

		const WIDTH = block.getWidth();

		const HEIGHT = block.getHeight();

		if ( !WIDTH || !HEIGHT ) {
			console.warn('Block got no dimension from its parameters or form children parameters');
			return
		};

		// Position this element according to earlier parent computation.
		// Delegate to BoxComponent.

		block.setPosFromParentRecords();

		// Position inner elements according to dimensions and layout parameters.
		// Delegate to BoxComponent.

		if ( !block.children.find( child => child.isInline ) ) {

			block.computeChildrenPosition();

		} else {

			block.computeInlinesPosition();

		};
		
		// Cleanup previous depictions

		DeepDelete( frameContainer );

		// Create new depictions

		const frame = Frame(
			WIDTH,
			HEIGHT,
			block.getBackgroundMaterial()
		);

		frame.renderOrder = block.getParentsNumber();

		frameContainer.add( frame );

		// Propagate update among children

		block.children.forEach( (child)=> {

			if ( !child.updateLayout ) return

			child.updateLayout();

		});

	};

	//

	block.updateInner = function UpdateInner() {

		block.position.z = block.getOffset();

		frameContainer.traverse( (child)=> {

			if ( child.material ) {

				child.material = block.getBackgroundMaterial();

			};

		});

		block.children.forEach( (child)=> {

			if ( !child.updateInner ) return

			child.updateInner();

		});
		
	};

	// Lastly set the options parameters to this object, which will trigger an update
	block.set( options, true, true );

	return block;

};

export default Block ;